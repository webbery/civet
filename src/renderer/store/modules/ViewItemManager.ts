
class ClassItem {
  #path: string;
  #name: string;
}

class ResourceItem {

}
class ViewItemManager {
  #classes: ClassItem[] = [];
  #items: ResourceItem[] = [];

  constructor() {}


}

export const ViewManager = new ViewItemManager()