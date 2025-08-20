
import Provider from "@sguez/d365-form-helpers/Provider";
import { DecoratorProfiler } from "./DecoratorProfiler";
import FormEventDispatcher from "./Dispatcher";
import { getFormEvents } from "./Registry";
import { FormEventTypes, FormTypeLabel, isComponentEventDetail } from "./Types";


/**
 * Base class for handling Dynamics 365 form events using decorators.
 *
 * This abstract class initializes and applies all decorated form events 
 * declared in a derived class, and provides built-in profiling and debugging capabilities.
 *
 * @remarks 
 * Extend this class to automatically register and apply all form event handlers decorated using `@D365Event` decorators.
 * 
 * The extended class must be instanciate during the onLoad event of the form.
 * 
 *
 * @example
 * ```ts
 * class ContactFormHandler extends FormEventHandlerBase {
 *      ⁤@D365Event.column.OnChange("attributeName")
 *      yourFunction(executionContext: Xrm.Events.EventContext) {
 *          // your logic here
 *      }
 * }
 * function onLoad(executionContext: Xrm.Events.EventContext) {
 *      new ContactFormHandler(executionContext);
 * }
 * ```
 */
export abstract class FormEventHandlerBase {

    private decoratorProfiling: { start?: number; end?: number } = {};


    constructor(executionContext: Xrm.Events.EventContext) {
        const formContext = Provider.from(executionContext);
        const formType = formContext.ui.getFormType();

        this.markFormEventStarted();
        FormEventDispatcher.apply(this, executionContext, formType);
        this.markFormEventApplied();
    }

    private markFormEventStarted() {
        this.decoratorProfiling.start = performance.now();
    }
    private markFormEventApplied() {
        this.decoratorProfiling.end = performance.now();
    }

    /**
     * Logs a summary of all form events registered via decorators in the current class.
     *
     * This method prints the list of decorated form event handlers, including event types,
     * associated components (for control- or tab-level events), and applicable form types.
     *
     * @remarks
     * Uses `console.debug` to output logs. These messages may be hidden in browser DevTools unless the logging level is set to "Verbose" or equivalent.
     *
     * Useful for debugging and verifying dynamic event registration.
     */
    public logRegisteredFormEvents() {
        console.group(`[D365FormEventHandlerBase - Profiling] Events registered from ${this.constructor.name} class`);
        for (const formEvents of getFormEvents(this.constructor)) {
            console.group(`+ ${formEvents.functionName}`);
            for (const detail of formEvents.events) {
                let extras = "";
                if (isComponentEventDetail(detail)) {
                    extras = `[${detail.componentNames.join(", ")}]`;
                }
                const typeDesc = `@${FormEventTypes[detail.type]} `;
                console.debug(`${typeDesc}${extras}`);
            }
            console.debug(`FormTypes: ${formEvents.formTypes?.map(formTypeValue => FormTypeLabel[formTypeValue]).join(", ") ?? "All"}`);
            console.groupEnd();
        }
        console.groupEnd();
    }

    /**
     * Logs the execution time of decorator initialization and event handler attachment.
     *
     * @remarks
     * Uses `console.debug` to output logs. These messages may be hidden in browser DevTools unless the logging level is set to "Verbose" or equivalent.
     *
     * This can be useful to identify performance bottlenecks related to decorator registration and application.
     */
    public logDecoratorProfilingTimes(): void {
        console.debug(`[D365FormEventHandlerBase - Profiling] Event decorators from ${this.constructor.name} initialized in ${DecoratorProfiler.total()}ms`);

        if (this.decoratorProfiling.end) {
            const duration = (this.decoratorProfiling.end - this.decoratorProfiling.start!).toFixed(2);
            console.debug(`[D365FormEventHandlerBase - Profiling] Decorator from ${this.constructor.name} attached to form event in ${duration}ms`);
        }
    }

}

export default FormEventHandlerBase;
