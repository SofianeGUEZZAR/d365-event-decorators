
import { ComponentEventType, FormEventTypes, GlobalEventType } from "./Types";
import { upsertFunctionEvent } from "./Registry";

function upsertSimpleEvent(formType: GlobalEventType): MethodDecorator {
    return (target, propertyKey) => {
        upsertFunctionEvent(target.constructor, propertyKey.toString(), { type: formType });
    };
}
function upsertComponentEvent(formType: ComponentEventType, componentNames: string[]): MethodDecorator {
    return (target, propertyKey) => {
        upsertFunctionEvent(target.constructor, propertyKey.toString(), { type: formType, componentNames });
    };
}

/**
 * Collection of decorators to bind Dynamics 365 event handlers to class methods.
 * 
 * This utility exposes method decorators for all main Dynamics 365 form, tab, attribute,
 * lookup, subgrid, iframe, process, PCF, and knowledge base search events, 
 * allowing binding event handlers.
 * 
 * Usage example:
 * ```ts
 * class MyFormHandlers {
 *   ⁤@D365Event.Form.OnLoad()
 *   onLoadHandler(executionContext: Xrm.ExecutionContext<Xrm.PageBase>) {
 *     // handler code
 *   }
 *   
 *   ⁤@D365Event.Column.OnChange("firstname")
 *   onFirstNameChange(executionContext: Xrm.ExecutionContext<Xrm.PageBase>) {
 *     // handler code
 *   }
 * }
 * ```
 */
export const D365Event = {

    Filter: {
        /**
         * Adds a form type filter to the decorated handler.
         * @see {@link "" External Link: Filter FormTypes event (Client API reference)}
         */
        FormTypes(formType: XrmEnum.FormType, ...otherFormTypes: XrmEnum.FormType[]): MethodDecorator {
            return (target, propertyKey) => {
                upsertFunctionEvent(target.constructor, propertyKey.toString(), undefined, [formType, ...otherFormTypes]);
            };
        },
    },

    Form: {
        /**
         * Adds a handler for the OnLoad form event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/form-onload External Link: Form OnLoad event (Client API reference)}
         */
        OnLoad() {
            return upsertSimpleEvent(FormEventTypes.OnLoad);
        },
        /**
         * Adds a handler for the OnDataLoad form event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/form-data-onload External Link: Form OnDataLoad event (Client API reference)}
         */
        OnDataLoad() {
            return upsertSimpleEvent(FormEventTypes.OnDataLoad);
        },
        /**
         * Adds a handler for the Loaded form event.
         * @remarks The executionContext is NOT automatically passed as the first parameter to the function.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/form-loaded External Link: Form Loaded event (Client API reference)}
         */
        Loaded() {
            return upsertSimpleEvent(FormEventTypes.Loaded);
        },
        /**
         * Adds a handler for the OnSave form event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/form-onsave External Link: Form OnSave event (Client API reference)}
         */
        OnSave() {
            return upsertSimpleEvent(FormEventTypes.OnSave);
        },
        /**
         * Adds a handler for the OnPostSave form event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/postsave External Link: Form OnPostSave event (Client API reference)}
         */
        OnPostSave() {
            return upsertSimpleEvent(FormEventTypes.OnPostSave);
        },
    },

    Tab: {
        /**
         * Adds a handler for the TabStateChange tab event.
         * @remarks This event occurs when a tab is expanded or collapsed.
         * @param tabControlName - The name of the tab control to bind the handler to.
         * @param othertabControlNames - Additional tab control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/tabstatechange External Link: TabStateChange event (Client API reference)}
         */
        OnStateChange(tabControlName: string, ...othertabControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnTabStateChange, [tabControlName, ...othertabControlNames]);
        },
        /**
         * Adds a handler for the TabStateChange tab event.
         * @remarks The handler is triggered only when the tab is expanding.
         * @param tabControlName - The name of the tab control to bind the handler to.
         * @param othertabControlNames - Additional tab control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/tabstatechange External Link: TabStateChange event (Client API reference)}
         */
        OnExpand(tabControlName: string, ...othertabControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnTabExpand, [tabControlName, ...othertabControlNames]);
        },
        /**
         * Adds a handler for the TabStateChange tab event.
         * @remarks The handler is triggered only when the tab is collapsing.
         * @param tabControlName - The name of the tab control to bind the handler to.
         * @param othertabControlNames - Additional tab control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/tabstatechange External Link: TabStateChange event (Client API reference)}
         */
        OnCollapse(tabControlName: string, ...othertabControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnTabCollapse, [tabControlName, ...othertabControlNames]);
        },
    },

    Column: {
        /**
         * Adds a handler for the OnChange column event.
         * @param attributeName - The name of the attribute to bind the handler to.
         * @param otherAttributeNames - Additional attribute names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/attribute-onchange External Link: Column OnChange event (Client API reference)}
         */
        OnChange(attributeName: string, ...otherAttributeNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnChange, [attributeName, ...otherAttributeNames]);
        },
    },

    Lookup: {
        /**
         * Adds a handler for the OnTagClick lookup event.
         * @param lookupControlName - The name of the lookup to bind the handler to.
         * @param otherLookupControlNames - Additional lookup names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onlookuptagclick External Link: OnLookupTagClick event (Client API reference)}
         */
        OnTagClick(lookupControlName: string, ...otherLookupControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnLookupTagClick, [lookupControlName, ...otherLookupControlNames]);
        },
        /**
         * Adds a handler for the OnPreSearch lookup event.
         * @param lookupControlName - The name of the lookup to bind the handler to.
         * @param otherLookupControlNames - Additional lookup names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/presearch External Link: Lookup OnPreSearch event (Client API reference)}
         */
        OnPreSearch(lookupControlName: string, ...otherLookupControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.PreSearch, [lookupControlName, ...otherLookupControlNames]);
        },
    },

    SubGrid: {
        /**
         * Adds a handler for the OnLoad subgrid event.
         * @param gridControlName - The name of the subgrid to bind the handler to.
         * @param otherGridControlNames - Additional subgrid names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/subgrid-onload External Link: SubGrid OnLoad event (Client API reference)}
         */
        OnLoad(gridControlName: string, ...otherGridControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.SubGridOnLoad, [gridControlName, ...otherGridControlNames]);
        },
        /**
         * Adds a handler for the OnRecordSelected subgrid event.
         * @param gridControlName - The name of the subgrid to bind the handler to.
         * @param otherGridControlNames - Additional subgrid names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/grid-onrecordselect External Link: Grid OnRecordSelected event (Client API reference)}
         */
        OnRecordSelected(gridControlName: string, ...otherGridControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.SubGridOnRecordSelect, [gridControlName, ...otherGridControlNames]);
        },
    },

    IFrame: {
        /**
         * Adds a handler for the OnReadyStateComplete iframe event.
         * @remarks Use getContentWindow with this handler to access the window object of an IFrame control, enabling interaction with its content.
         * @param webresourceControlName - The name of the webresource control to bind the handler to.
         * @param otherWebresourceControlNames - Additional webresource control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onreadystatecomplete External Link: IFrame OnReadyStateComplete event (Client API reference)}
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/controls/getcontentwindow External Link: getContentWindow (Client API reference)}
         */
        OnReadyStateComplete(webresourceControlName: string, ...otherWebresourceControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnReadyStateComplete, [webresourceControlName, ...otherWebresourceControlNames]);
        },
    },

    Process: {
        /**
         * Adds a handler for the OnStatusChange process event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onprocessstatuschange" External Link: OnProcessStatusChange event (Client API reference)}
         */
        OnStatusChange() {
            return upsertSimpleEvent(FormEventTypes.OnProcessStatusChange);
        },
        /**
         * Adds a handler for the OnPreStatusChange process event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onpreprocessstatuschange External Link: OnPreProcessStatusChange event (Client API reference)}
         */
        OnPreStatusChange() {
            return upsertSimpleEvent(FormEventTypes.OnPreProcessStatusChange);
        },
        /**
         * Adds a handler for the OnPreStageChange process event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onprestagechange External Link: OnPreStageChange event (Client API reference)}
         */
        OnPreStageChange() {
            return upsertSimpleEvent(FormEventTypes.OnPreStageChange);
        },
        /**
         * Adds a handler for the OnStageChange process event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onstagechange External Link: OnStageChange event (Client API reference)}
         */
        OnStageChange() {
            return upsertSimpleEvent(FormEventTypes.OnStageChange);
        },
        /**
         * Adds a handler for the OnStageSelected process event.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onstageselected External Link: OnStageSelected event (Client API reference)}
         */
        OnStageSelected() {
            return upsertSimpleEvent(FormEventTypes.OnStageSelected);
        },
    },

    PCF: {
        /**
         * Adds a handler for the OnOutputChange PCF control event.
         * @param pcfControlName - The name of the pcf control to bind the handler to.
         * @param otherPcfControlNames - Additional pcf control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onoutputchange External Link: OnOutputChange event (Client API reference)}
         */
        OnOutputChange(pcfControlName: string, ...otherPcfControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnOutputChange, [pcfControlName, ...otherPcfControlNames]);
        },
    },

    KnowledgeBaseSearch: {
        /**
         * Adds a handler for the OnResultOpened knowledge base search event.
         * @param kbSearchControlName - The name of the knowledge base search control to bind the handler to.
         * @param otherKbSearchControlNameControlNames - Additional knowledge base search control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onresultopened External Link: OnResultOpened event (Client API reference)}
         */
        OnResultOpened(kbSearchControlName: string, ...otherKbSearchControlNameControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnResultOpened, [kbSearchControlName, ...otherKbSearchControlNameControlNames]);
        },
        /**
         * Adds a handler for the OnSelection knowledge base search event.
         * @param kbSearchControlName - The name of the knowledge base search control to bind the handler to.
         * @param otherKbSearchControlNameControlNames - Additional knowledge base search control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/onselection External Link: OnSelection event (Client API reference)}
         */
        OnSelection(kbSearchControlName: string, ...otherKbSearchControlNameControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.OnSelection, [kbSearchControlName, ...otherKbSearchControlNameControlNames]);
        },
        /**
         * Adds a handler for the PostSearch knowledge base search event.
         * @param kbSearchControlName - The name of the knowledge base search control to bind the handler to.
         * @param otherKbSearchControlNameControlNames - Additional knowledge base search control names to bind the handler to.
         * @see {@link https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events/postsearch External Link: PostSearch event (Client API reference)}
         */
        PostSearch(kbSearchControlName: string, ...otherKbSearchControlNameControlNames: string[]) {
            return upsertComponentEvent(FormEventTypes.PostSearch, [kbSearchControlName, ...otherKbSearchControlNameControlNames]);
        },
    },
}

export default D365Event;
