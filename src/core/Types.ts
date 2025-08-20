
export enum FormEventTypes {
    OnLoad = "OnLoad",
    OnDataLoad = "OnDataLoad",
    Loaded = "Loaded",

    OnSave = "OnSave",
    OnPostSave = "OnPostSave",

    OnChange = "OnChange",

    OnLookupTagClick = "OnLookupTagClick",
    PreSearch = "PreSearch",

    OnTabStateChange = "OnTabStateChange",
    OnTabExpand = "OnTabExpand",
    OnTabCollapse = "OnTabCollapse",

    SubGridOnLoad = "SubGridOnLoad",
    SubGridOnRecordSelect = "SubGridOnRecordSelect",

    OnReadyStateComplete = "OnReadyStateComplete",

    OnProcessStatusChange = "OnProcessStatusChange",
    OnPreProcessStatusChange = "OnPreProcessStatusChange",
    OnPreStageChange = "OnPreStageChange",
    OnStageChange = "OnStageChange",
    OnStageSelected = "OnStageSelected",

    OnOutputChange = "OnOutputChange",

    OnResultOpened = "OnResultOpened",
    OnSelection = "OnSelection",
    PostSearch = "PostSearch",
}

export type GlobalEventType =
    | FormEventTypes.OnDataLoad
    | FormEventTypes.OnLoad
    | FormEventTypes.Loaded

    | FormEventTypes.OnSave
    | FormEventTypes.OnPostSave

    | FormEventTypes.OnProcessStatusChange
    | FormEventTypes.OnPreProcessStatusChange
    | FormEventTypes.OnPreStageChange
    | FormEventTypes.OnStageChange
    | FormEventTypes.OnStageSelected


export type ComponentEventType =
    | FormEventTypes.OnChange

    | FormEventTypes.OnLookupTagClick
    | FormEventTypes.PreSearch

    | FormEventTypes.OnTabStateChange
    | FormEventTypes.OnTabExpand
    | FormEventTypes.OnTabCollapse

    | FormEventTypes.SubGridOnLoad
    | FormEventTypes.SubGridOnRecordSelect

    | FormEventTypes.OnReadyStateComplete

    | FormEventTypes.OnOutputChange

    | FormEventTypes.OnResultOpened
    | FormEventTypes.OnSelection
    | FormEventTypes.PostSearch


type GlobalEventDetail = {
    type: GlobalEventType;
}
type ComponentEventDetail = {
    type: ComponentEventType;
    componentNames: string[];
}


export type EventDetail = GlobalEventDetail | ComponentEventDetail;


export type FormEventDetails = {
    functionName: string;
    formTypes?: XrmEnum.FormType[] | undefined;
    events: EventDetail[];
}


// export function CheckEventDetailType<T extends FormEventTypes>(eventType: T) {
//     return function (eventDetail: EventDetail): eventDetail is Extract<EventDetail, { type: T; }> {
//         return eventDetail.type === eventType;
//     }
// }

export function isMatchingComponentEvent(
    eventDetail: EventDetail,
    type: ComponentEventType
): eventDetail is Extract<ComponentEventDetail, { type: typeof type }> {
    return eventDetail.type === type && isComponentEventDetail(eventDetail);
}

export function isComponentEventDetail(eventDetail: EventDetail): eventDetail is ComponentEventDetail {
    return 'componentNames' in eventDetail;
}




export const FormTypeLabel: Record<XrmEnum.FormType, string> = {
    [XrmEnum.FormType.Undefined]: 'Undefined',
    [XrmEnum.FormType.Create]: 'Create',
    [XrmEnum.FormType.Update]: 'Update',
    [XrmEnum.FormType.ReadOnly]: 'ReadOnly',
    [XrmEnum.FormType.Disabled]: 'Disabled',
    [XrmEnum.FormType.BulkEdit]: 'BulkEdit',
    [XrmEnum.FormType.QuickCreate]: 'QuickCreate',
    [XrmEnum.FormType.ReadOptimized]: 'ReadOptimized',
};