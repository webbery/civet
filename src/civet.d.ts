
declare module 'civet' {

    export const version: string;
    
    export enum PropertyType {
        String = 1,
        Number = 2,
        Color = 3,
        Binary = 4
    }

    export interface IProperty {
        name: string;
        type: PropertyType;
        query: boolean;
        store: boolean;
        value: any;
    }

    export interface IResource {
        id: number;
        type: string;
        name: string;
        path: string ;
        remote: string|null;
        tag: string[];
        category: string[];
        thumnail: ArrayBuffer;
        anno?: string[];
        keyword: string[];
        [propName: string]: any;

        /**
         * @brief add a new property. If property exist, it will be changed.
         * @param prop property
         */
        putProperty(prop: IProperty): void;
        /**
         * @brief get property by name. If property is not exist, return null.
         * @param name property name
         */
        getProperty(name: string): IProperty|null;
        /**
         * @brief remove an exist property
         * @param name property name
         */
        removePropery(name: string): boolean;
    }

    // export class IParser {
        // pipeline?: IMessagePipeline;
    // }

    export interface Thenable<T> {
        then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
        then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
    }
    /**
     * extension context
     */
    export interface ExtensionContext {
        currentDB: string;
    }

    // export let extensionContext: ExtensionContext;
    export let activate: ((context: ExtensionContext) => any) | null;
    export let unactivate: (() => any) | null;

    export interface IWebview {
        html: string;
    }

    export interface IPropertyPage extends IWebview {

    }

    export interface INavigationPage extends IWebview {}

    export interface IOverviewPage extends IWebview {}
    export interface IDetailviewPage extends IWebview {}

    export enum ViewType {
        Property = 1,
        Navigation = 2,
        Overview = 3,
        DetailView = 4,
        Search = 5
    }

    /**
     * ConditionItem is embeded into search bar, which is to update search conditions
     */
    export interface ConditionItem {
        html: string;
        conditions: Array<string|Date>;
        // onQueryChange();
    }
    export interface SearchBar {
        items: ConditionItem[];
    }

    export interface PropertyView {
        name: string;
        html: string;
    }

    export namespace window {
        export let searchBar: SearchBar;
    //     export function createWebviewPanel(viewtype: ViewType): IWebview;
        export function createConditionItem(id: string): ConditionItem;

        export let propertyView: PropertyView;
    }
}
