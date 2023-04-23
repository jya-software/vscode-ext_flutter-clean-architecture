import * as changeCase from "change-case";

export function genCleanDomainEntitiesTemplate (entityName: string): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  return `abstract class ${pascalCaseDomainEntityName}Type {
//  String get id;
}
  `;
}