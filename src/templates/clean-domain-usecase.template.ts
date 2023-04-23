import * as changeCase from "change-case";

export function genCleanDomainUsecaseTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const variableCaseEntityName = pascalCaseEntityName[0].toLowerCase() + pascalCaseEntityName.slice(1);
  const className = isList ? `Load${pascalCaseEntityName}ListUsecase` : `Load${pascalCaseEntityName}Usecase`;
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  return `import 'package:shared_lib/base.dart' show AsyncResponse, UseCase, NoParams;

import '../entities/${snakeCaseEntityName}_type.dart';
import '../repositories/${snakeCaseEntityName}_repo_type.dart';

class ${className} extends UseCase<${typeName}, NoParams> {
  ${className}(this.${variableCaseEntityName}RepoType);
  final ${pascalCaseEntityName}RepoType ${variableCaseEntityName}RepoType;

  @override
  Future<AsyncResponse<${typeName}>> call(NoParams params) async {
    final res = await ${variableCaseEntityName}RepoType.get${pascalCaseEntityName}${isList ? 'List' : ''}();            
    return res;
  }
}
`;
}
