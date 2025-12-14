/**
 * Types for Template Engine Service
 */

/**
 * Template variables for substitution
 */
export type TemplateVariables = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * Template loading options
 */
export type TemplateLoadOptions = {
  useCache?: boolean;
};

/**
 * Template substitution result
 */
export type TemplateSubstitutionResult = {
  content: string;
  unsubstitutedVariables: string[];
};

/**
 * Database code generation variables
 */
export type DatabaseCodeGenerationVariables = {
  entityName?: string;
  entityNameLower?: string;
  tableName?: string;
  fields?: string;
  connectionName?: string;
  databaseUrl?: string;
};

/**
 * Generated database code
 */
export type GeneratedDatabaseCode = {
  connection: string;
  schema: string;
  repository: string;
};

/**
 * Generated connection code
 */
export type GeneratedConnectionCode = {
  connectionName: string;
  code: string;
};

/**
 * Generated schema code
 */
export type GeneratedSchemaCode = {
  entityName: string;
  code: string;
};

/**
 * Generated repository code
 */
export type GeneratedRepositoryCode = {
  entityName: string;
  code: string;
};
