import * as changeCase from "change-case";

export function genCleanDomainRepoTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  const methodName = isList ? `get${pascalCaseEntityName}List` : `get${pascalCaseEntityName}`;
  return `import 'package:shared_lib/base.dart' show AsyncResponse;
import '../entities/${snakeCaseEntityName}_type.dart';

abstract class ${pascalCaseEntityName}RepoType {
  Future<AsyncResponse<${typeName}>> ${methodName}();
}
`;
}
