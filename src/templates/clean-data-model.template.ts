import * as changeCase from "change-case";

export function genCleanDataEntitiesTemplate (entityName: string): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  return `import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';

import '../../domain/entities/${snakeCaseDomainEntityName}_type.dart';  

part '${snakeCaseDomainEntityName}_model.freezed.dart';
part '${snakeCaseDomainEntityName}_model.g.dart';

@freezed
class ${pascalCaseDomainEntityName}Model with _$${pascalCaseDomainEntityName}Model implements ${pascalCaseDomainEntityName}Type {
  const ${pascalCaseDomainEntityName}Model._();
  const factory ${pascalCaseDomainEntityName}Model({
    
  }) = _${pascalCaseDomainEntityName}Model;

  factory ${pascalCaseDomainEntityName}Model.fromJson(Map<String, Object?> json) =>
      _$${pascalCaseDomainEntityName}ModelFromJson(json);
}  
  `;
}

export function genCleanDataNetResponseTemplate (entityName: string, isList: boolean): string {
  const pascalCaseDomainEntityName = changeCase.pascalCase(entityName.toLowerCase());
  const snakeCaseDomainEntityName = changeCase.snakeCase(entityName.toLowerCase());
  const fileName = isList ? `${snakeCaseDomainEntityName}s` : `${snakeCaseDomainEntityName}`;
  const className = isList ? `${pascalCaseDomainEntityName}s` : `${pascalCaseDomainEntityName}`;
  const responseType = isList ? `${className}Data` : `${className}Model`;

  const listModelClass = isList ? `@Freezed(makeCollectionsUnmodifiable: false)
class ${className}Data with _$${className}Data {
  const factory ${className}Data({
    @JsonKey(name: "${snakeCaseDomainEntityName}_list") List<${pascalCaseDomainEntityName}Model>? ${fileName},
  }) = _${className}Data;

  factory ${className}Data.fromJson(Map<String, Object?> json) =>
      _$${className}DataFromJson(json);
}` : '';

  return `import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';
import 'package:base/base.dart' show NetResponse;

import '${snakeCaseDomainEntityName}_model.dart';

part '${fileName}_net_response.freezed.dart';
part '${fileName}_net_response.g.dart';

@freezed
class ${className}NetResponse
    with _$${className}NetResponse
    implements NetResponse<${responseType}> {
  const factory ${className}NetResponse({
    required int code,
    @JsonKey(name: "description") String? message,
    @JsonKey(name: "data") ${responseType}? data,
  }) = _${className}NetResponse;

  factory ${className}NetResponse.fromJson(Map<String, Object?> json) =>
      _$${className}NetResponseFromJson(json);
}

${listModelClass}
`;
}