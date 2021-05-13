
declare module 'civet' {

    export const version: string;
    
    export interface IResource {
        id: number;
        type: string;
        name: string;
        path: string ;
        remote: string|null;
        meta: Object[];
        tag: string[];
        category: string[];
        anno?: string[];
        keyword: string[];
        [propName: string]: any;

        addMeta(key: string, value: any, type: string | undefined): void;
    }

    export class IParser {
        // pipeline?: IMessagePipeline;
    }

    export interface Thenable<T> {
        then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
        then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
    }
    /**
     * extension context
     */
    export class ExtensionContext {
        currentDB: string;
        static _isConnecting: boolean;
    }

    // export let extensionContext: ExtensionContext;
    export let activate: ((context: ExtensionContext) => any) | null = null;
    export let unactivate: (() => any) | null = null;
    export interface IProperty {
        readonly key: string;
    }
    /**
             * resource of uri, such as file, web page, or remote machine setting etc.
             */
    export let resource: IResource;

    export interface IWebview {
        html: string;
    }

    export interface IPropertyPage extends IWebview {

    }

    export interface INavigationPage extends IWebview {}

    export interface IOverviewPage extends IWebview {}
    export interface IDetailviewPage extends IWebview {}

    export enum ViewType {
        Property,
        Navigation,
        Overview,
        DetailView
    }

    export interface ISearchIcon {}
    export namespace window {
        export function createWebviewPanel(viewtype: ViewType): IWebview;
        export function createSearchIcon(): ISearchIcon;    
    }
}
