import * as changeCase from "change-case";

export function genCleanDataDatasourceTypeTemplate (entityName: string, isList: boolean): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseDomainEntityName}Model>` : `${pascalCaseDomainEntityName}Model`;
  const methodName = isList ? `get${pascalCaseDomainEntityName}List` : `get${pascalCaseDomainEntityName}`;
  return `import 'package:shared_lib/base.dart' show AsyncResponse;

import '../models/${snakeCaseDomainEntityName}_model.dart';

abstract class ${pascalCaseDomainEntityName}DatasourceType {
  Future<AsyncResponse<${typeName}>> ${methodName}();
}
  `;
}

export function genCleanLocalDataDatasourceTemplate (entityName: string, isList: boolean): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseDomainEntityName}Model>` : `${pascalCaseDomainEntityName}Model`;
  const methodName = isList ? `get${pascalCaseDomainEntityName}List` : `get${pascalCaseDomainEntityName}`;
  const defaultVarName = isList ? `default${pascalCaseDomainEntityName}s` : `default${pascalCaseDomainEntityName}`;
  const defaultVarValue = isList ? `[ const ${pascalCaseDomainEntityName}() ]` : `const ${pascalCaseDomainEntityName}()`;
  return `import 'package:shared_lib/base.dart' show AsyncResponse;
import '${snakeCaseDomainEntityName}_datasource_type.dart';
import '../models/${snakeCaseDomainEntityName}_model.dart';

class ${pascalCaseDomainEntityName}LocalDatasource extends ${pascalCaseDomainEntityName}DatasourceType {
  static final ${typeName} ${defaultVarName} = ${defaultVarValue};

  @override
  Future<AsyncResponse<${typeName}>> ${methodName}() async {
    return AsyncResponse(data: ${defaultVarName});
  }
}
  `;
}

export function genCleanDataApiTemplate(entityName: string, isList: boolean){
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const methodName = isList ? `get${pascalCaseDomainEntityName}List` : `get${pascalCaseDomainEntityName}`;
  const netResName = isList ? `${pascalCaseDomainEntityName}sNetResponse` : `${pascalCaseDomainEntityName}NetResponse`;
  return `import 'package:retrofit/retrofit.dart';
import 'package:shared_lib/dio.dart';

import '../models/${snakeCaseDomainEntityName}${isList ? "s":""}_net_response.dart';

part '${snakeCaseDomainEntityName}_api.g.dart';

@RestApi(baseUrl: "")
abstract class ${pascalCaseDomainEntityName}Api {
  factory ${pascalCaseDomainEntityName}Api(Dio dio, {String baseUrl}) = _${pascalCaseDomainEntityName}Api;

  @GET("/api/init/")
  Future<${netResName}> ${methodName}(@Query('client_id') String clientId);
}
  `;
}

export function genCleanRemoteDatasourceTemplate (entityName: string, isList: boolean): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const typeName = isList ? `List<${pascalCaseDomainEntityName}Model>` : `${pascalCaseDomainEntityName}Model`;
  const methodName = isList ? `get${pascalCaseDomainEntityName}List` : `get${pascalCaseDomainEntityName}`;
  const netResName = isList ? `${pascalCaseDomainEntityName}sNetResponse` : `${pascalCaseDomainEntityName}NetResponse`;
  return `import 'package:shared_lib/base.dart'
show AsyncResponse, NetConfig, handleNetResponse;
import '../models/${snakeCaseDomainEntityName}${isList ? "s":""}_net_response.dart';
import '../models/${snakeCaseDomainEntityName}_model.dart';

import '${snakeCaseDomainEntityName}_api.dart';
import '${snakeCaseDomainEntityName}_datasource_type.dart';

class ${pascalCaseDomainEntityName}RemoteDatasource extends ${pascalCaseDomainEntityName}DatasourceType {
  final ${pascalCaseDomainEntityName}Api api;
  ${pascalCaseDomainEntityName}RemoteDatasource(this.api);

  @override
  Future<AsyncResponse<${typeName}>> ${methodName}() async {
    return handleNetResponse<${typeName}, ${netResName}>(
        api.${methodName}(NetConfig.appKey));
  }
}
  `;
}