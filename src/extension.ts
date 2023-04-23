import * as _ from "lodash";
import * as changeCase from "change-case";
import * as mkdirp from "mkdirp";
import * as path from "path";

import {
  commands,
  ExtensionContext,
  InputBoxOptions,
  OpenDialogOptions,
  QuickPickOptions,
  Uri,
  window,
} from "vscode";
import { existsSync, lstatSync, writeFile, appendFile } from "fs";
import {
  getBlocEventTemplate,
  getBlocStateTemplate,
  getBlocTemplate,
  getCubitStateTemplate,
  getCubitTemplate,
  genCleanDataApiTemplate,
  genCleanDataDatasourceTypeTemplate,
  genCleanDataEntitiesTemplate,
  genCleanDataNetResponseTemplate,
  genCleanDataRepoTemplate,
  genCleanDomainEntitiesTemplate,
  genCleanDomainRepoTemplate,
  genCleanDomainUsecaseTemplate,
  genCleanLocalDataDatasourceTemplate,
  genCleanRemoteDatasourceTemplate
} from "./templates";
import { analyzeDependencies } from "./utils";

export function activate (_context: ExtensionContext) {
  analyzeDependencies();

  commands.registerCommand("extension.new-feature-bloc", async (uri: Uri) => {
    Go(uri, false);
  });

  commands.registerCommand("extension.new-feature-cubit", async (uri: Uri) => {
    Go(uri, true);
  });
}

export async function Go (uri: Uri, useCubit: boolean) {
  // Show feature prompt
  let featureName = await promptForFeatureName();

  // Abort if name is not valid
  if (!isNameValid(featureName)) {
    window.showErrorMessage("The name must not be empty");
    return;
  }

  featureName = `${featureName}`;

  let entityName = featureName;
  let isList = false;

  if(!useCubit){
    entityName = await promptForEntityName(featureName);
    if (!isNameValid(entityName)) {
      window.showErrorMessage("The name must not be empty");
    }
    entityName = `${entityName}`;
    isList = await promptForDataList();
  }
 
  let targetDirectory = "";
  try {
    targetDirectory = await getTargetDirectory(uri);
  } catch (error) {
    window.showErrorMessage(error.message);
  }

  const useEquatable = true;
  const useFreezed = true;

  const pascalCaseFeatureName = changeCase.pascalCase(
    featureName.toLowerCase()
  );
  try {
    await generateFeatureArchitecture(
      `${featureName}`,
      targetDirectory,
      useEquatable,
      useCubit,
      useFreezed
    );
    await generateCleanArchitectureCode(
      `${featureName}`,
      `${entityName}`,
      isList,
      targetDirectory,
    );
    window.showInformationMessage(
      `Successfully Generated ${pascalCaseFeatureName} Feature`
    );
  } catch (error) {
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
}

export function isNameValid (featureName: string | undefined): boolean {
  // Check if feature name exists
  if (!featureName) {
    return false;
  }
  // Check if feature name is null or white space
  if (_.isNil(featureName) || featureName.trim() === "") {
    return false;
  }

  // Return true if feature name is valid
  return true;
}

export async function getTargetDirectory (uri: Uri): Promise<string> {
  let targetDirectory;
  if (_.isNil(_.get(uri, "fsPath")) || !lstatSync(uri.fsPath).isDirectory()) {
    targetDirectory = await promptForTargetDirectory();
    if (_.isNil(targetDirectory)) {
      throw Error("Please select a valid directory");
    }
  } else {
    targetDirectory = uri.fsPath;
  }

  return targetDirectory;
}

export async function promptForTargetDirectory (): Promise<string | undefined> {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select a folder to create the feature in",
    canSelectFolders: true,
  };

  return window.showOpenDialog(options).then((uri) => {
    if (_.isNil(uri) || _.isEmpty(uri)) {
      return undefined;
    }
    return uri[0].fsPath;
  });
}

export function promptForFeatureName (): Thenable<string | undefined> {
  const blocNamePromptOptions: InputBoxOptions = {
    prompt: "Feature Name",
    placeHolder: "counter",
  };
  return window.showInputBox(blocNamePromptOptions);
}

export function promptForEntityName (featureName: string): Thenable<string | undefined> {
  const entityNamePromptOptions: InputBoxOptions = {
    prompt: "Entity Name",
    placeHolder: featureName,
    value: featureName,
  };
  return window.showInputBox(entityNamePromptOptions);
}

export async function promptForDataList (): Promise<boolean> {
  const useDataListPromptValues: string[] = ["no (default)", "yes (advanced)"];
  const useDataListPromptOptions: QuickPickOptions = {
    placeHolder:
      "Is your response is List<DataModel>?",
    canPickMany: false,
  };
  const answer = await window.showQuickPick(
    useDataListPromptValues,
    useDataListPromptOptions
  );

  return answer === "yes (advanced)";
}

export async function promptForUseEquatable (): Promise<boolean> {
  const useEquatablePromptValues: string[] = ["no (default)", "yes (advanced)"];
  const useEquatablePromptOptions: QuickPickOptions = {
    placeHolder:
      "Do you want to use the Equatable Package in bloc to override equality comparisons?",
    canPickMany: false,
  };

  const answer = await window.showQuickPick(
    useEquatablePromptValues,
    useEquatablePromptOptions
  );

  return answer === "yes (advanced)";
}

async function generateCleanArchitectureCode(
  featureName: string,
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const featuresDirectoryPath = getFeaturesDirectoryPath(targetDirectory);
  const featureDirectoryPath = path.join(featuresDirectoryPath, featureName);
  const dataDirectoryPath = path.join(featureDirectoryPath, "data");
  const domainDirectoryPath = path.join(featureDirectoryPath, "domain");
  await Promise.all([
    generateDomainCode(featureName, entityName, isList, domainDirectoryPath),
    generateDataCode(featureName, entityName,isList, dataDirectoryPath)
  ]);
}

async function generateDomainCode(
  featureName: string,
  entityName:string,
  isList: boolean,
  targetDirectory: string) {
  await Promise.all([
    createDomainEntityTemplate(entityName, isList, path.join(targetDirectory, "entities")),
    createDomainRepositoryTemplate(entityName, isList, path.join(targetDirectory, "repositories")),
    createDomainUsecaseTemplate(entityName, isList, path.join(targetDirectory, "usecases")),
  ]);
}

async function createDomainEntityTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  const entityFileName = `${snakeCaseName}_type.dart`;
  const entityFilePath = path.join(targetDirectory, entityFileName);
  const entityFileContent = await genCleanDomainEntitiesTemplate(entityName);
  await createTemplateFile(entityFilePath, entityFileContent);
}

async function createDomainRepositoryTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  const repositoryFileName = `${snakeCaseName}_repo_type.dart`;
  const repositoryFilePath = path.join(targetDirectory, repositoryFileName);
  const repositoryFileContent = await genCleanDomainRepoTemplate(entityName, isList);
  await createTemplateFile(repositoryFilePath, repositoryFileContent);
}

async function createDomainUsecaseTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  const fileName = isList ? `${snakeCaseName}_list` : `${snakeCaseName}`;
  const usecaseFileName = `load_${fileName}_usecase.dart`;
  const usecaseFilePath = path.join(targetDirectory, usecaseFileName);
  const usecaseFileContent = await genCleanDomainUsecaseTemplate(entityName, isList);
  await createTemplateFile(usecaseFilePath, usecaseFileContent);
}

async function generateDataCode(
  featureName: string,
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  await Promise.all([
    createDataDatasourceTemplate(entityName, isList, path.join(targetDirectory, "datasources")),
    createDataModelTemplate(entityName, isList, path.join(targetDirectory, "models")),
    createDataRepositoryTemplate(entityName, isList, path.join(targetDirectory, "repositories")),
  ]);
}

async function createDataDatasourceTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  // api
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  const apiFileName = `${snakeCaseName}_api.dart`;
  const apiFilePath = path.join(targetDirectory, apiFileName);
  const apiFileContent = await genCleanDataApiTemplate(entityName, isList);
  await createTemplateFile(apiFilePath, apiFileContent);
  // datasource type
  const datasourceTypeFileName = `${snakeCaseName}_datasource_type.dart`;
  const datasourceTypeFilePath = path.join(targetDirectory, datasourceTypeFileName);
  const datasourceTypeFileContent = await genCleanDataDatasourceTypeTemplate(entityName, isList);
  await createTemplateFile(datasourceTypeFilePath, datasourceTypeFileContent);
  // local datasource
  const localDatasourceFileName = `${snakeCaseName}_local_datasource.dart`;
  const localDatasourceFilePath = path.join(targetDirectory, localDatasourceFileName);
  const localDatasourceFileContent = await genCleanLocalDataDatasourceTemplate(entityName, isList);
  await createTemplateFile(localDatasourceFilePath, localDatasourceFileContent);
  // remote datasource
  const remoteDatasourceFileName = `${snakeCaseName}_remote_datasource.dart`;
  const remoteDatasourceFilePath = path.join(targetDirectory, remoteDatasourceFileName);
  const remoteDatasourceFileContent = await genCleanRemoteDatasourceTemplate(entityName, isList);
  await createTemplateFile(remoteDatasourceFilePath, remoteDatasourceFileContent);
}

async function createDataModelTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  // model
  const modelFileName = `${snakeCaseName}_model.dart`;
  const modelFilePath = path.join(targetDirectory, modelFileName);
  const modelFileContent = await genCleanDataEntitiesTemplate(entityName);  
  await createTemplateFile(modelFilePath, modelFileContent);
  // net response
  const netResName = isList ? `${snakeCaseName}s` : `${snakeCaseName}`;
  const netResponseFileName = `${netResName}_net_response.dart`;
  const netResponseFilePath = path.join(targetDirectory, netResponseFileName);
  const netResponseFileContent = await genCleanDataNetResponseTemplate(entityName, isList);
  await createTemplateFile(netResponseFilePath, netResponseFileContent);
}

async function createDataRepositoryTemplate(
  entityName: string,
  isList: boolean,
  targetDirectory: string) {
  const snakeCaseName = changeCase.snakeCase(entityName.toLowerCase());
  const repositoryFileName = `${snakeCaseName}_repo.dart`;
  const repositoryFilePath = path.join(targetDirectory, repositoryFileName);
  const repositoryFileContent = await genCleanDataRepoTemplate(entityName, isList);
  await createTemplateFile(repositoryFilePath, repositoryFileContent);
}

async function generateBlocCode (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean,
  useFreezed: boolean,
) {
  const blocDirectoryPath = `${targetDirectory}/bloc`;
  if (!existsSync(blocDirectoryPath)) {
    await createDirectory(blocDirectoryPath);
  }

  await Promise.all([
    createBlocEventTemplate(blocName, targetDirectory, useEquatable, useFreezed),
    createBlocStateTemplate(blocName, targetDirectory, useEquatable, useFreezed),
    createBlocTemplate(blocName, targetDirectory, useEquatable, useFreezed),
  ]);
}

async function generateCubitCode (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const blocDirectoryPath = `${targetDirectory}/cubit`;
  if (!existsSync(blocDirectoryPath)) {
    await createDirectory(blocDirectoryPath);
  }

  await Promise.all([
    createCubitStateTemplate(blocName, targetDirectory, useEquatable),
    createCubitTemplate(blocName, targetDirectory, useEquatable),
  ]);
}

export async function generateFeatureArchitecture (
  featureName: string,
  targetDirectory: string,
  useEquatable: boolean,
  useCubit: boolean,
  useFreezed: boolean
) {
  // Create the features directory if its does not exist yet
  const featuresDirectoryPath = getFeaturesDirectoryPath(targetDirectory);
  if (!existsSync(featuresDirectoryPath)) {
    await createDirectory(featuresDirectoryPath);
  }

  // Create the feature directory
  const featureDirectoryPath = path.join(featuresDirectoryPath, featureName);
  await createDirectory(featureDirectoryPath);

  // Create the data layer
  const dataDirectoryPath = path.join(featureDirectoryPath, "data");
  await createDirectories(dataDirectoryPath, [
    "datasources",
    "models",
    "repositories",
  ]);

  // Create the domain layer
  const domainDirectoryPath = path.join(featureDirectoryPath, "domain");
  await createDirectories(domainDirectoryPath, [
    "entities",
    "repositories",
    "usecases",
  ]);

  // Create the presentation layer
  const presentationDirectoryPath = path.join(
    featureDirectoryPath,
    "presentation"
  );
  await createDirectories(presentationDirectoryPath, [
    useCubit ? "cubit" : "bloc",
    "pages",
    "widgets",
  ]);

  // Generate the bloc code in the presentation layer
  useCubit
    ? await generateCubitCode(featureName, presentationDirectoryPath, useEquatable)
    : await generateBlocCode(featureName, presentationDirectoryPath, useEquatable, useFreezed);
}



export function getFeaturesDirectoryPath (currentDirectory: string): string {
  // Split the path
  const splitPath = currentDirectory.split(path.sep);

  // Remove trailing \
  if (splitPath[splitPath.length - 1] === "") {
    splitPath.pop();
  }

  // Rebuild path
  const result = splitPath.join(path.sep);

  // Determines whether we're already in the features directory or not
  const isDirectoryAlreadyFeatures =
    splitPath[splitPath.length - 1] === "features";

  // If already return the current directory if not, return the current directory with the /features append to it
  return isDirectoryAlreadyFeatures ? result : path.join(result, "features");
}

export async function createDirectories (
  targetDirectory: string,
  childDirectories: string[]
): Promise<void> {
  // Create the parent directory
  await createDirectory(targetDirectory);
  // Creat the children
  childDirectories.map(
    async (directory) =>
      await createDirectory(path.join(targetDirectory, directory))
  );
}

function createDirectory (targetDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    mkdirp(targetDirectory, (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

function createBlocEventTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean,
  useFreezed: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_event.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_event.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getBlocEventTemplate(blocName, useEquatable, useFreezed),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createTemplateFile(targetPath: string, content: string): Promise<boolean> {
  if (existsSync(targetPath)) {
    throw Error(`${targetPath} already exists`);
  }
  return new Promise((resolve, reject) => {
    writeFile(targetPath, content, "utf8", (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(true);
    });
  });
}

function createBlocStateTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean,
  useFreezed: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_state.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getBlocStateTemplate(blocName, useEquatable, useFreezed),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createBlocTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean,
  useFreezed: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_bloc.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_bloc.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getBlocTemplate(blocName, useEquatable, useFreezed),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createCubitStateTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/cubit/${snakeCaseBlocName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_state.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitStateTemplate(blocName, useEquatable),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}

function createCubitTemplate (
  blocName: string,
  targetDirectory: string,
  useEquatable: boolean
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/cubit/${snakeCaseBlocName}_cubit.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_cubit.dart already exists`);
  }
  return new Promise(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitTemplate(blocName, useEquatable),
      "utf8",
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }
    );
  });
}
