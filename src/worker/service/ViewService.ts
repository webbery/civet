import { BaseExtension, ExtensionPackage, MenuDetail } from "worker/ExtensionPackage";
import { BaseService, IViewService } from "./ServiceInterface";

export class ViewService extends BaseService implements IViewService {
  menus() { 
    return this.extension.menus
  }

  keybinds() {
    return this.extension.keybindings
  }
}