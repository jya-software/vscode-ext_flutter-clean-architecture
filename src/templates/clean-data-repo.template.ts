import * as changeCase from "change-case";

function genLocalOnlyDataRepoTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  const methodName = isList ? `get${pascalCaseEntityName}List` : `get${pascalCaseEntityName}`;
  return `import 'package:base/base.dart' show AsyncResponse;

import '../../domain/entities/${snakeCaseEntityName}_type.dart';
import '../../domain/repositories/${snakeCaseEntityName}_repo_type.dart';
import '../datasources/${snakeCaseEntityName}_local_datasource.dart';

class ${pascalCaseEntityName}Repo implements ${pascalCaseEntityName}RepoType {
  final ${pascalCaseEntityName}LocalDatasource localDatasource;

  ${pascalCaseEntityName}Repo(this.localDatasource);
  @override
  Future<AsyncResponse<${typeName}>> ${methodName}() async {
    return await localDatasource.${methodName}();
  }
}
`;
}

function genRemoteOnlyDataRepoTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  const methodName = isList ? `get${pascalCaseEntityName}List` : `get${pascalCaseEntityName}`;
  return `import 'package:base/base.dart' show AsyncResponse;

import '../../domain/entities/${snakeCaseEntityName}_type.dart';
import '../../domain/repositories/${snakeCaseEntityName}_repo_type.dart';
import '../datasources/${snakeCaseEntityName}_remote_datasource.dart';

class ${pascalCaseEntityName}Repo implements ${pascalCaseEntityName}RepoType {
  final ${pascalCaseEntityName}RemoteDatasource remoteDatasource;

  ${pascalCaseEntityName}Repo(this.remoteDatasource);
  @override
  Future<AsyncResponse<${typeName}>> ${methodName}() async {
    return await remoteDatasource.${methodName}();
  }
}
`;
}

function genBothDataRepoTemplate(entityName: string, isList: boolean): string {
  const pascalCaseEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseEntityName}Type>` : `${pascalCaseEntityName}Type`;
  const methodName = isList ? `get${pascalCaseEntityName}List` : `get${pascalCaseEntityName}`;
  return `import 'package:base/base.dart' show AsyncResponse;

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

export function genCleanDataRepoTemplate(entityName: string, isList: boolean, datasource: number){
  switch (datasource) {
    case 0:
      return genBothDataRepoTemplate(entityName, isList);
    case 1:
      return genLocalOnlyDataRepoTemplate(entityName, isList);
    case 2:
      return genRemoteOnlyDataRepoTemplate(entityName, isList);
    default:
      return genBothDataRepoTemplate(entityName, isList);
  }
}

