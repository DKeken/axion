import { readFile, readdir, stat } from "fs/promises";
import { join, resolve } from "path";

import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import {
  CODE_BLOCK_REGEX,
  TEMPLATE_EXTENSIONS,
  TEMPLATE_PATHS,
  VARIABLE_PLACEHOLDER_PATTERN,
} from "@/codegen/constants/template-engine.constants";
import type {
  TemplateLoadOptions,
  TemplateSubstitutionResult,
  TemplateVariables,
} from "@/codegen/types/template-engine.types";

/**
 * Template Engine Service
 * Загружает templates из файловой системы, подставляет переменные и кэширует результаты
 */
@Injectable()
export class TemplateEngineService extends BaseService {
  private readonly templateCache = new Map<string, string>();
  private readonly templatesBasePath: string;

  constructor() {
    super(TemplateEngineService.name);
    this.templatesBasePath = this.resolveTemplatesPath();
    this.logger.log(`Templates base path: ${this.templatesBasePath}`);
  }

  /**
   * Загружает template из файла
   * @param templatePath - путь к template относительно templatesBasePath
   * @param options - опции загрузки
   */
  @CatchError({ operation: "loading template" })
  async loadTemplate(
    templatePath: string,
    options: TemplateLoadOptions = {}
  ): Promise<string> {
    const { useCache = true } = options;
    const fullPath = join(this.templatesBasePath, templatePath);

    // Проверяем кэш
    if (useCache && this.templateCache.has(templatePath)) {
      this.logger.debug(`Template cache hit: ${templatePath}`);
      const cached = this.templateCache.get(templatePath);
      if (cached) {
        return cached;
      }
    }

    try {
      // Проверяем существование файла
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) {
        throw new Error(`Template path is not a file: ${templatePath}`);
      }

      // Читаем файл
      const content = await readFile(fullPath, "utf-8");

      // Извлекаем код из markdown
      const codeContent = this.extractCodeFromMarkdown(content);

      // Кэшируем
      if (useCache) {
        this.templateCache.set(templatePath, codeContent);
      }

      this.logger.debug(
        `Template loaded: ${templatePath} (${codeContent.length} chars)`
      );
      return codeContent;
    } catch (error) {
      return handleServiceError(
        this.logger,
        `loading template: ${templatePath}`,
        error,
        {
          operation: `loading template: ${templatePath}`,
          additional: {
            templatePath,
            fullPath,
          },
        }
      ) as never;
    }
  }

  /**
   * Подставляет переменные в template
   * @param template - template с переменными вида {VARIABLE_NAME}
   * @param variables - объект с переменными для подстановки
   * @returns результат подстановки с информацией о неподставленных переменных
   */
  substituteVariables(
    template: string,
    variables: TemplateVariables
  ): TemplateSubstitutionResult {
    let result = template;

    // Подставляем все переменные
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      const replacement =
        value !== undefined && value !== null ? String(value) : "";

      // Заменяем все вхождения
      result = result.replace(
        new RegExp(this.escapeRegex(placeholder), "g"),
        replacement
      );
    }

    // Проверяем, остались ли неподставленные переменные
    const remainingPlaceholders = result.match(VARIABLE_PLACEHOLDER_PATTERN);
    const unsubstitutedVariables = remainingPlaceholders
      ? remainingPlaceholders.map((p) => p.slice(1, -1))
      : [];

    if (unsubstitutedVariables.length > 0) {
      this.logger.warn(
        `Template has unsubstituted variables: ${unsubstitutedVariables.join(", ")}`
      );
    }

    return {
      content: result,
      unsubstitutedVariables,
    };
  }

  /**
   * Загружает и подставляет переменные в один шаг
   */
  @CatchError({ operation: "loading and substituting template" })
  async loadAndSubstitute(
    templatePath: string,
    variables: TemplateVariables,
    options: TemplateLoadOptions = {}
  ): Promise<string> {
    const template = await this.loadTemplate(templatePath, options);
    const result = this.substituteVariables(template, variables);
    return result.content;
  }

  /**
   * Загружает все templates из директории
   * @param directoryPath - путь к директории относительно templatesBasePath
   * @returns Map с именами файлов (без расширения) и их содержимым
   */
  @CatchError({ operation: "loading templates from directory" })
  async loadTemplatesFromDirectory(
    directoryPath: string
  ): Promise<Map<string, string>> {
    const fullPath = join(this.templatesBasePath, directoryPath);
    const templates = new Map<string, string>();

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && this.isTemplateFile(entry.name)) {
          const templatePath = join(directoryPath, entry.name);
          const content = await this.loadTemplate(templatePath, {
            useCache: true,
          });

          // Используем имя файла без расширения как ключ
          const key = this.removeExtension(entry.name);
          templates.set(key, content);
        }
      }

      this.logger.debug(
        `Loaded ${templates.size} templates from ${directoryPath}`
      );
    } catch (error) {
      return handleServiceError(
        this.logger,
        `loading templates from directory: ${directoryPath}`,
        error,
        {
          operation: `loading templates from directory: ${directoryPath}`,
          additional: {
            directoryPath,
            fullPath,
          },
        }
      ) as never;
    }

    return templates;
  }

  /**
   * Очищает кэш templates
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log("Template cache cleared");
  }

  /**
   * Получает путь к templates базовой директории
   */
  getTemplatesBasePath(): string {
    return this.templatesBasePath;
  }

  /**
   * Определяет путь к templates директории
   */
  private resolveTemplatesPath(): string {
    let projectRoot = process.cwd();

    // Если мы в apps/codegen-service, поднимаемся на 2 уровня вверх
    if (
      projectRoot.endsWith("apps/codegen-service") ||
      projectRoot.endsWith("apps\\codegen-service")
    ) {
      projectRoot = resolve(projectRoot, "../..");
    }

    return join(projectRoot, TEMPLATE_PATHS.BASE);
  }

  /**
   * Извлекает код из markdown файла
   * Ищет блоки ```typescript или ```ts и извлекает их содержимое
   */
  private extractCodeFromMarkdown(markdown: string): string {
    const matches = Array.from(markdown.matchAll(CODE_BLOCK_REGEX));

    if (matches.length === 0) {
      // Если нет блоков кода, возвращаем весь контент (может быть plain text template)
      this.logger.debug(
        "No code blocks found in template, returning full content"
      );
      return markdown;
    }

    // Если есть несколько блоков, объединяем их
    if (matches.length > 1) {
      this.logger.debug(`Found ${matches.length} code blocks, combining them`);
      return matches.map((match) => match[1]?.trim() || "").join("\n\n");
    }

    // Один блок кода
    return matches[0]?.[1]?.trim() || "";
  }

  /**
   * Экранирует специальные символы для использования в RegExp
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Проверяет, является ли файл template файлом
   */
  private isTemplateFile(filename: string): boolean {
    return TEMPLATE_EXTENSIONS.some((ext) => filename.endsWith(ext));
  }

  /**
   * Удаляет расширение из имени файла
   */
  private removeExtension(filename: string): string {
    return filename.replace(/\.(mdx|md)$/, "");
  }
}
