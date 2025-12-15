/**
 * SSH Encryption Service
 * Шифрование SSH ключей и паролей с использованием AES-256-GCM
 *
 * Использует master key из переменной окружения SSH_ENCRYPTION_MASTER_KEY
 * и генерирует ключ шифрования через scrypt для дополнительной безопасности.
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  type ScryptOptions,
} from "crypto";

/**
 * Key length для scrypt (32 bytes для AES-256)
 */
const SCRYPT_KEYLEN = 32;

/**
 * Salt для scrypt (можно использовать константу, так как master key уже уникален)
 * В production можно использовать env переменную для дополнительной безопасности
 */
const SCRYPT_SALT = Buffer.from("axion-ssh-encryption-salt-v1", "utf8");

/**
 * Параметры для scrypt (вычисление ключа из master key)
 * N: CPU/memory cost parameter (2^16 = 65536) - увеличивает сложность
 * r: block size parameter (8) - влияет на использование памяти
 * p: parallelization parameter (1) - количество параллельных потоков
 */
const SCRYPT_OPTIONS: ScryptOptions = {
  N: 65536, // 2^16
  r: 8,
  p: 1,
  maxmem: 128 * 1024 * 1024, // 128 MB max memory
};

/**
 * Обертка для scrypt с поддержкой options
 */
function scryptAsync(
  password: string | Buffer | NodeJS.TypedArray | DataView,
  salt: string | Buffer | NodeJS.TypedArray | DataView,
  keylen: number,
  options?: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options || {}, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

/**
 * Размеры для AES-256-GCM
 */
const IV_LENGTH = 12; // 12 bytes для GCM (рекомендуемый размер)
const AUTH_TAG_LENGTH = 16; // 16 bytes для authentication tag в GCM
const ALGORITHM = "aes-256-gcm";

@Injectable()
export class SshEncryptionService implements OnModuleInit {
  private readonly logger = new Logger(SshEncryptionService.name);
  private encryptionKey: Buffer | null = null;
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  async onModuleInit() {
    await this.initializeEncryptionKey();
  }

  /**
   * Инициализация ключа шифрования из master key
   */
  private async initializeEncryptionKey(): Promise<void> {
    const masterKey = process.env.SSH_ENCRYPTION_MASTER_KEY;

    if (!masterKey) {
      const message =
        "SSH_ENCRYPTION_MASTER_KEY environment variable is not set. " +
        "SSH keys will NOT be encrypted!";

      if (this.isProduction) {
        this.logger.error(message);
        throw new Error(
          "SSH_ENCRYPTION_MASTER_KEY is required in production environment"
        );
      } else {
        this.logger.warn(message);
        // В dev можно работать без шифрования
        return;
      }
    }

    try {
      const derivedKey = await this.deriveKey(masterKey);
      this.encryptionKey = derivedKey;

      this.logger.log("SSH encryption key initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize encryption key", error);
      throw error;
    }
  }

  /**
   * Генерация ключа шифрования из master key
   */
  private deriveKey(masterKey: string): Promise<Buffer> {
    return scryptAsync(masterKey, SCRYPT_SALT, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
  }

  /**
   * Проверка доступности шифрования
   */
  private isEncryptionAvailable(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Шифрование текста
   *
   * Формат зашифрованного значения: base64(iv (12 bytes) + authTag (16 bytes) + ciphertext)
   *
   * @param plaintext - незашифрованный текст
   * @returns зашифрованный текст в base64 или исходный текст, если шифрование недоступно
   */
  encrypt(plaintext: string | null | undefined): string | null {
    // Обработка null/undefined
    if (plaintext === null || plaintext === undefined) {
      return null;
    }

    // Если шифрование недоступно, возвращаем исходный текст (для dev окружения)
    if (!this.isEncryptionAvailable()) {
      this.logger.warn(
        "Encryption not available, storing plaintext (dev mode only)"
      );
      return plaintext;
    }

    try {
      // Генерируем случайный IV
      const iv = randomBytes(IV_LENGTH);

      // Создаем cipher
      const cipher = createCipheriv(ALGORITHM, this.encryptionKey!, iv);

      // Шифруем текст
      let encrypted = cipher.update(plaintext, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Получаем authentication tag
      const authTag = cipher.getAuthTag();

      // Объединяем: iv + authTag + ciphertext
      const result = Buffer.concat([iv, authTag, encrypted]);

      // Кодируем в base64
      return result.toString("base64");
    } catch (error) {
      this.logger.error("Failed to encrypt data", error);
      throw new Error("Encryption failed");
    }
  }

  /**
   * Расшифровка текста
   *
   * @param encrypted - зашифрованный текст в base64
   * @returns расшифрованный текст или исходный текст, если шифрование не использовалось
   */
  decrypt(encrypted: string | null | undefined): string | null {
    // Обработка null/undefined
    if (encrypted === null || encrypted === undefined) {
      return null;
    }

    // Если шифрование недоступно, возвращаем исходный текст
    if (!this.isEncryptionAvailable()) {
      return encrypted;
    }

    try {
      // Декодируем из base64
      const data = Buffer.from(encrypted, "base64");

      // Проверяем минимальный размер (iv + authTag)
      const minSize = IV_LENGTH + AUTH_TAG_LENGTH;
      if (data.length < minSize) {
        // Возможно, это незашифрованные данные (legacy или dev mode)
        this.logger.warn(
          "Data appears to be unencrypted (legacy format), returning as-is"
        );
        return encrypted;
      }

      // Извлекаем компоненты
      const iv = data.subarray(0, IV_LENGTH);
      const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      // Создаем decipher
      const decipher = createDecipheriv(ALGORITHM, this.encryptionKey!, iv);
      decipher.setAuthTag(authTag);

      // Расшифровываем
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Failed to decrypt data", error);
      // В случае ошибки расшифровки (например, неправильный master key),
      // не возвращаем частично расшифрованные данные
      throw new Error(
        "Decryption failed - invalid encrypted data or master key"
      );
    }
  }

  /**
   * Пере-шифровка значения с использованием нового master key
   * Используется для ротации ключей
   */
  async rotateSecret(
    encrypted: string | null | undefined,
    oldMasterKey: string,
    newMasterKey: string
  ): Promise<string | null> {
    if (encrypted === null || encrypted === undefined) {
      return null;
    }

    // Используем явные ключи для ротации, игнорируя текущий режим (dev/prod)
    const oldKey = await this.deriveKey(oldMasterKey);
    const newKey = await this.deriveKey(newMasterKey);

    // Расшифровка с использованием старого ключа
    const data = Buffer.from(encrypted, "base64");
    const minSize = IV_LENGTH + AUTH_TAG_LENGTH;

    if (data.length < minSize) {
      // Скорее всего данные не были зашифрованы (dev режим/legacy)
      return encrypted;
    }

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, oldKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const plaintext = decrypted.toString("utf8");

    // Шифрование с новым ключом
    const newIv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, newKey, newIv);
    let reEncrypted = cipher.update(plaintext, "utf8");
    reEncrypted = Buffer.concat([reEncrypted, cipher.final()]);
    const newAuthTag = cipher.getAuthTag();
    const result = Buffer.concat([newIv, newAuthTag, reEncrypted]);

    return result.toString("base64");
  }

  /**
   * Проверка, является ли значение зашифрованным
   * Используется для миграции существующих незашифрованных данных
   */
  isEncrypted(value: string | null | undefined): boolean {
    if (!value || !this.isEncryptionAvailable()) {
      return false;
    }

    try {
      const data = Buffer.from(value, "base64");
      // Если данные в правильном формате (достаточный размер для iv + authTag)
      return data.length >= IV_LENGTH + AUTH_TAG_LENGTH;
    } catch {
      // Если не base64 или невалидный формат - не зашифровано
      return false;
    }
  }
}
