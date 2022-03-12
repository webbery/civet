import { BaseExtension, ExtensionPackage } from "worker/ExtensionPackage";
import { BaseService, IViewService } from "./ServiceInterface";

export class ViewService extends BaseService implements IViewService {
  #extension: ExtensionPackage;

  constructor(extension: ExtensionPackage) {
    super(extension)
  }
}