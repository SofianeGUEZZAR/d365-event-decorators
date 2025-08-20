
import { warnMessage } from "../utils/logger";
import FormEventHandlerBase from "./HandlerBase";
import { getFormEvents } from "./Registry";
import { ComponentEventType, EventDetail, FormEventDetails, FormEventTypes, FormTypeLabel, isMatchingComponentEvent } from "./Types";
import { FormContext, isAttribute, isGridControl, isIframeControl, isKbSearchControl, isLookupControl, isStandardControl, isTabControl } from "@sguez/d365-form-helpers";
import ContextProvider from '@sguez/d365-form-helpers/Provider';




const warningCounts = new Map<string, number>();

export function logGroupedWarning(message: string) {
    const count = warningCounts.get(message) || 0;
    warningCounts.set(message, count + 1);
}

export function flushGroupedWarnings() {
    for (const [msg, count] of warningCounts.entries()) {
        const prefix = count > 1 ? `(${count}x)` : "";
        warnMessage(`${prefix} ${msg}`);
    }
    warningCounts.clear();
}



export class FormEventDispatcher {

    static apply(instance: FormEventHandlerBase, executionContext: Xrm.Events.EventContext, formType: XrmEnum.FormType): void {
        const formEvents = getFormEvents(instance.constructor);
        this.validateHandlers(instance, formEvents);

        const formContext = ContextProvider.from(executionContext);

        this.applyOnDataLoadEvents(instance, formEvents, formContext, formType);
        this.applyOnLoadEvents(instance, formEvents, formContext, formType);
        this.applyLoadedEvents(instance, formEvents, formContext, formType);

        this.applyOnSaveEvents(instance, formEvents, formContext, formType);
        this.applyOnPostSaveEvents(instance, formEvents, formContext, formType);

        this.applyOnTabStateChangeEvents(instance, formEvents, formContext, formType);
        this.applyOnTabExpandEvents(instance, formEvents, formContext, formType);
        this.applyOnTabCollapseEvents(instance, formEvents, formContext, formType);

        this.applyOnChangeEvents(instance, formEvents, formContext, formType);

        this.applyOnLookupTagClickEvents(instance, formEvents, formContext, formType);
        this.applyPreSearchEvents(instance, formEvents, formContext, formType);

        this.applySubGridOnLoadEvents(instance, formEvents, formContext, formType);
        this.applySubGridOnRecordSelectEvents(instance, formEvents, formContext, formType);

        this.applyOnReadyStateCompleteEvents(instance, formEvents, formContext, formType);

        this.applyOnProcessStatusChangeEvents(instance, formEvents, formContext, formType);
        this.applyOnPreProcessStatusChangeEvents(instance, formEvents, formContext, formType);
        this.applyOnPreStageChangeEvents(instance, formEvents, formContext, formType);
        this.applyOnStageChangeEvents(instance, formEvents, formContext, formType);
        this.applyOnStageSelectedEvents(instance, formEvents, formContext, formType);

        this.applyOnOutputChangeEvents(instance, formEvents, formContext, formType);

        this.applyOnResultOpenedEvents(instance, formEvents, formContext, formType);
        this.applyOnSelectionEvents(instance, formEvents, formContext, formType);
        this.applyPostSearchEvents(instance, formEvents, formContext, formType);

        flushGroupedWarnings();
    }



    //#region Utils
    private static isFormTypeAuthorized(formTypes: XrmEnum.FormType[] | undefined, currentFormType: XrmEnum.FormType): boolean {
        return !formTypes || formTypes.length === 0 || formTypes.includes(currentFormType);
    }
    private static validateHandlers<T extends FormEventHandlerBase>(instance: T, handlers: FormEventDetails[]) {
        const formUnknownEvents = handlers.filter(h => h.events.length === 0).map(event => event.functionName);

        if (formUnknownEvents.length > 0)
            logGroupedWarning(`[D365FormEventDispatcher] ${instance.constructor.name}.validateHandlers - Method${formUnknownEvents.length > 1 ? 's' : ''} "${formUnknownEvents.join(', ')}" has @FormTypes but no events.`);
    }
    //#endregion


    //#region Generic dispatchers
    private static applySimpleEvents<TInstance extends FormEventHandlerBase>(
        instance: TInstance,
        handlers: FormEventDetails[],
        formContext: FormContext,
        formType: XrmEnum.FormType,
        eventType: FormEventTypes,
        eventFunction: { [K in keyof FormContext]: FormContext[K] extends (eventFunction: Xrm.Events.ContextSensitiveHandler) => void ? (Parameters<FormContext[K]>[0] extends Xrm.Events.ContextSensitiveHandler ? K : never) : never }[keyof FormContext]
    ) {
        const formEvents = handlers.filter(h => h.events.find(e => e.type === eventType));

        for (const formEvent of formEvents) {
            if (!this.isFormTypeAuthorized(formEvent.formTypes, formType)) continue;
            if (!(instance as any)[formEvent.functionName]) continue;

            const functionBindToInstance = (instance as any)[formEvent.functionName].bind(instance);
            formContext[eventFunction](functionBindToInstance);
        }
    }

    private static applyComponentEvents<TInstance extends FormEventHandlerBase, TValid>(
        instance: TInstance,
        handlers: FormEventDetails[],
        formContext: FormContext,
        formType: XrmEnum.FormType,
        eventType: ComponentEventType,
        getItems: (formContext: FormContext, itemNames: string[]) => TValid[],
        itemTypeChecker: (item: unknown) => item is TValid,
        getItemName: (item: TValid) => string,
        register: (formControl: FormContext, items: TValid[], handler: Xrm.Events.ContextSensitiveHandler) => void
    ) {
        const formEvents = handlers.filter(h => h.events.find(eventDetail => eventDetail.type === eventType));

        for (const formEvent of formEvents) {
            if (!this.isFormTypeAuthorized(formEvent.formTypes, formType)) continue;
            if (!(instance as any)[formEvent.functionName]) continue;

            const functionBindToInstance = (instance as any)[formEvent.functionName].bind(instance);
            for (const event of formEvent.events.filter(eventDetail => isMatchingComponentEvent(eventDetail, eventType))) {
                const formItemNames = event.componentNames;

                const items = getItems(formContext, formItemNames).filter(item => itemTypeChecker(item));

                register(formContext, items, functionBindToInstance);

                const foundItemNames = items.map(item => getItemName(item));
                const unfoundItemNames = formItemNames.filter(itemName => !foundItemNames.includes(itemName));

                if (unfoundItemNames.length > 0)
                    logGroupedWarning(`[D365FormEventDispatcher] ${instance.constructor.name} - Attribute${unfoundItemNames.length > 1 ? 's' : ''} "${unfoundItemNames.join(', ')}" not found or not applicable for event "${eventType}" on function "${formEvent.functionName}" and form type ${FormTypeLabel[formType]}.`);
            }
        }
    }
    //#endregion


    //#region Load Events
    private static applyOnDataLoadEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnDataLoad, "addOnDataLoad");
    }
    private static applyOnLoadEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnLoad, "addOnLoad");
    }
    private static applyLoadedEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.Loaded, "addLoaded");
    }
    //#endregion


    //#region Save Events
    private static applyOnSaveEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnSave, "addOnSave");
    }
    private static applyOnPostSaveEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnPostSave, "addOnPostSave");
    }
    //#endregion


    //#region Tab Events
    private static applyOnTabStateChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnTabStateChange,
            (formContext, tabNames) => formContext.getTab(tabNames),
            isTabControl,
            (item) => item.getName(),
            (formContext, items, handler) => formContext.addTabStateChange(items, handler)
        );
    }
    private static _applyOnTabSpecificStateEvents<TInstance extends FormEventHandlerBase, TEvent extends EventDetail>(
        instance: TInstance,
        handlers: FormEventDetails[],
        formContext: FormContext,
        formType: XrmEnum.FormType,
        eventType: ComponentEventType,
        authorizedTabDisplayState: Xrm.DisplayState
    ) {

        this.applyComponentEvents(instance, handlers, formContext, formType, eventType,
            (formContext, tabNames) => formContext.getTab(tabNames),
            isTabControl,
            (item) => item.getName(),
            (_, items, handler) => {
                for (const tabControl of items) {
                    tabControl.addTabStateChange((executionContext) => {
                        const formContext = ContextProvider.from(executionContext);
                        const tabControl = formContext.getEventSource() as any as Xrm.Controls.Tab;
                        if (tabControl) {
                            const tabDisplayState = tabControl.getDisplayState();
                            if (tabDisplayState === authorizedTabDisplayState) {
                                handler(executionContext);
                            }
                        }
                    });
                }
            }
        );
    }
    private static applyOnTabExpandEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this._applyOnTabSpecificStateEvents(instance, handlers, formContext, formType, FormEventTypes.OnTabExpand, "expanded");
    }
    private static applyOnTabCollapseEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this._applyOnTabSpecificStateEvents(instance, handlers, formContext, formType, FormEventTypes.OnTabCollapse, "collapsed");
    }
    //#endregion


    //#region Change Events
    private static applyOnChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnChange,
            (formContext, attributeNames) => formContext.getAttribute(attributeNames),
            isAttribute,
            (item) => item.getName(),
            (formContext, items, handler) => formContext.addOnChange(items, handler)
        );
    }
    //#endregion


    //#region Lookup Events
    private static applyOnLookupTagClickEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnLookupTagClick,
            (formContext, lookupNames) => formContext.getControl(lookupNames),
            isLookupControl,
            (item) => item.getName(),
            (formContext, items, handler) => formContext.addOnLookupTagClick(items, handler)
        );
    }
    private static applyPreSearchEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.PreSearch,
            (formContext, lookupNames) => formContext.getControl(lookupNames),
            isLookupControl,
            (item) => item.getName(),
            (formContext, items, handler) => formContext.addPreSearch(items, handler)
        );
    }
    //#endregion


    //#region SubGrid Events
    private static applySubGridOnLoadEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.SubGridOnLoad,
            (formContext, gridNames) => formContext.getControl(gridNames),
            isGridControl,
            (gridControl) => gridControl.getName(),
            (formContext, gridControls, handler) => formContext.addSubGridOnLoad(gridControls, handler)
        );
    }
    private static applySubGridOnRecordSelectEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.SubGridOnRecordSelect,
            (formContext, gridNames) => formContext.getControl(gridNames),
            isGridControl,
            (gridControl) => gridControl.getName(),
            (formContext, gridControls, handler) => formContext.addSubGridOnRecordSelect(gridControls, handler)
        );
    }
    //#endregion


    //#region IFrame Events
    private static applyOnReadyStateCompleteEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnReadyStateComplete,
            (formContext, webresourceNames) => formContext.getControl(webresourceNames),
            isIframeControl,
            (gridControl) => gridControl.getName(),
            (formContext, iframeControls, handler) => formContext.addOnReadyStateComplete(iframeControls, handler)
        );
    }
    //#endregion


    //#region BPF Events
    private static applyOnProcessStatusChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnProcessStatusChange, "addOnProcessStatusChange");
    }
    private static applyOnPreProcessStatusChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnPreProcessStatusChange, "addOnPreProcessStatusChange");
    }
    private static applyOnPreStageChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnPreStageChange, "addOnPreStageChange");
    }
    private static applyOnStageChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnStageChange, "addOnStageChange");
    }
    private static applyOnStageSelectedEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {
        this.applySimpleEvents(instance, handlers, formContext, formType, FormEventTypes.OnStageSelected, "addOnStageSelected");
    }
    //#endregion


    //#region PCF Events
    private static applyOnOutputChangeEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnReadyStateComplete,
            (formContext, webresourceNames) => formContext.getControl(webresourceNames),
            isStandardControl,
            (gridControl) => gridControl.getName(),
            (formContext, controls, handler) => formContext.addOnOutputChange(controls, handler)
        );
    }
    //#endregion


    //#region KnowledgeBase Events
    private static applyOnResultOpenedEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnResultOpened,
            (formContext, webresourceNames) => formContext.getControl(webresourceNames),
            isKbSearchControl,
            (knowlageBaseSearchControl) => knowlageBaseSearchControl.getName(),
            (formContext, knowlageBaseSearchControl, handler) => formContext.addOnResultOpened(knowlageBaseSearchControl, handler)
        );
    }
    private static applyOnSelectionEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.OnSelection,
            (formContext, webresourceNames) => formContext.getControl(webresourceNames),
            isKbSearchControl,
            (knowlageBaseSearchControl) => knowlageBaseSearchControl.getName(),
            (formContext, knowlageBaseSearchControl, handler) => formContext.addOnSelection(knowlageBaseSearchControl, handler)
        );
    }
    private static applyPostSearchEvents<TInstance extends FormEventHandlerBase>(instance: TInstance, handlers: FormEventDetails[], formContext: FormContext, formType: XrmEnum.FormType) {

        this.applyComponentEvents(instance, handlers, formContext, formType, FormEventTypes.PostSearch,
            (formContext, webresourceNames) => formContext.getControl(webresourceNames),
            isKbSearchControl,
            (knowledgeBaseSearchControl) => knowledgeBaseSearchControl.getName(),
            (formContext, knowledgeBaseSearchControl, handler) => formContext.addOnPostSearch(knowledgeBaseSearchControl, handler)
        );
    }
    //#endregion
}

export default FormEventDispatcher;
