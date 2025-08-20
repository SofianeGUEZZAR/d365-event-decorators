import { DecoratorProfiler } from "./DecoratorProfiler";
import { EventDetail, FormEventDetails, isComponentEventDetail } from "./Types";


const eventRegistry = new Map<Function, FormEventDetails[]>();
// const eventRegistry = new WeakMap<Function, FormEvent[]>();


export function getFormEvents(constructor: Function): FormEventDetails[] {
    const events: FormEventDetails[] = eventRegistry.get(constructor) || [];
    (events as any).log = () => console.table(events.map(e => ({ fn: e.functionName, types: e.formTypes, events: e.events.map(ev => ev.type).join(', ') })));
    return events;
}

export function upsertFunctionEvent<T extends EventDetail>(constructor: Function, functionName: string, eventDetail?: T, formTypes?: XrmEnum.FormType[]): void {
    const start = performance.now();

    const formEvents: FormEventDetails[] = getFormEvents(constructor);
    let formEvent = formEvents.find(event => event.functionName === functionName);

    if (!formEvent) {
        formEvents.push({
            events: eventDetail ? [eventDetail] : [],
            functionName,
            formTypes
        });
    }
    else {
        if (eventDetail) {
            const existingEventForFunctionName = formEvent.events.find(e => e.type === eventDetail.type);
            if (!existingEventForFunctionName) {
                formEvent.events.push(eventDetail);
            }
            else if (isComponentEventDetail(existingEventForFunctionName) && isComponentEventDetail(eventDetail)) {
                existingEventForFunctionName.componentNames = mergeUnique(existingEventForFunctionName.componentNames, eventDetail.componentNames);
            }
        }
        if (formTypes) {
            formEvent.formTypes = mergeUnique(formEvent.formTypes ?? [], formTypes);
        }
    }

    eventRegistry.set(constructor, formEvents);

    const end = performance.now();
    DecoratorProfiler.record(end - start);
}

function mergeUnique<T>(existing: T[], incoming: T[]): T[] {
    return [...existing, ...incoming.filter(i => !existing.includes(i))];
}


