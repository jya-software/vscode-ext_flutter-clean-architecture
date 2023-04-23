import * as changeCase from "change-case";

export function genCleanDataRepoTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  const methodName = isList ? `get${pascalCaseEntityName}List` : `get${pascalCaseEntityName}`;
  return `import 'package:shared_lib/base.dart' show AsyncResponse;

import '../../domain/entities/${snakeCaseEntityName}_type.dart';
import '../../domain/repositories/${snakeCaseEntityName}_repo_type.dart';
import '../datasources/${snakeCaseEntityName}_local_datasource.dart';
import '../datasources/${snakeCaseEntityName}_remote_datasource.dart';

class ${pascalCaseEntityName}Repo implements ${pascalCaseEntityName}RepoType {
  final ${pascalCaseEntityName}LocalDatasource localDatasource;
  final ${pascalCaseEntityName}RemoteDatasource remoteDatasource;

  ${pascalCaseEntityName}Repo(this.remoteDatasource, this.localDatasource);
  @override
  Future<AsyncResponse<${typeName}>> ${methodName}() async {
    final res = await remoteDatasource.${methodName}();
    if (res.success) {
      return res;
    }
    return await localDatasource.${methodName}();
  }
}
`;
}
