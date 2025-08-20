
# D365 Event Decorators

**TypeScript decorators for Dynamics 365 form events**

A lightweight, type-safe, and extensible library for declaring Dynamics 365 model-driven app form event handlers using `TypeScript decorators legacy`.

Use decorators to bind handlers to form-level, control-level, tab-level, subgrid, iframe, PCF, process, and knowledge-base search events without manually wiring everything in the form editor. The library provides runtime registration, event dispatching utilities, and basic profiling/logging to help debug and optimize event attachment.

Events are based on the official Microsoft documentation. For more information, see:

* [Doc Event](https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/events)
* [Doc getEventSource](https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/executioncontext/geteventsource)


---

## Table of contents

* [Key features](#key-features)
* [Install](#install)
* [Quick Start](#quick-start)
* [API & Decorators](#api--decorators)
* [Runtime pieces](#runtime-pieces)
* [Examples (exhaustive)](#examples-exhaustive)
* [Debugging & Profiling](#debugging--profiling)
* [Known Issues (Dynamics-specific)](#known-issues-dynamics-specific)

---

## Key features

* **Declarative syntax** for form events with TypeScript decorators.
* **Runtime registry and dispatcher** that attaches handlers to the form through a single `FormEventHandlerBase` instance.
* **Supports global form events** (`OnLoad`, `OnSave`, `OnPostSave`, etc.).
* **Control-level events** (`OnChange`, `OnPreSearch`, etc.).
* **Tab and section visibility events**.
* **Subgrid, iframe, and PCF events**.
* **Business process flow events**.
* **Knowledge base search events**.
* **Built-in profiling** to measure decorator initialization and attachment times.
* **Debugging utilities** for inspecting registered event handlers.

---

## Install

> This README assumes you already have a build pipeline that compiles TypeScript for use in Dynamics 365. The library is designed to be bundled with your form scripts.

Install as an internal dependency (example with npm):

```bash
npm install --save-dev @sguez/d365-event-decorators
```

### TypeScript configuration

It is recommended to set the following in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "NodeNext",
    "module": "NodeNext"
  }
}
```

### Compiling

Keep your business logic in TypeScript, compile to a single (minified) JS file for Dynamics web resource consumption.

---

## Quick Start

1. Create a class that extends `FormEventHandlerBase`.
2. Decorate methods with `D365Event.*` decorators to declare the events you want to bind.
3. Instantiate the handler in your form `onLoad` function and pass the execution context.

```ts
import { FormEventHandlerBase } from "@sguez/d365-event-decorators/HandlerBase";
import D365Event from "@sguez/d365-event-decorators/Decorators";

class ContactFormHandler extends FormEventHandlerBase {
  @D365Event.Form.OnLoad()
  onFormLoad(executionContext: Xrm.Events.EventContext) {
    // your form logic
  }

  @D365Event.Column.OnChange("firstname")
  onFirstNameChange(executionContext: Xrm.Events.EventContext) {
    // logic when firstname changes
  }
}

export function onLoad(executionContext: Xrm.Events.EventContext) {
  // instantiate once per form
  new ContactFormHandler(executionContext);
}
```

---

## API & Decorators

All decorators are exported under the `D365Event` namespace. They come in several categories. **Where decorators accept a control/name parameter, they accept one *or many* names** (e.g. `@D365Event.Column.OnChange("firstname", "lastname")`).

* `D365Event.Form` — global form events:

  * `OnLoad()`
  * `OnDataLoad()`
  * `Loaded()`
  * `OnSave()`
  * `OnPostSave()`

* `D365Event.Tab` — tab events (one or many tab names):

  * `OnStateChange(tabName1, tabName2, ...)`
  * `OnExpand(tabName1, ...)`
  * `OnCollapse(tabName1, ...)`

* `D365Event.Column` — attribute events (one or many attribute names):

  * `OnChange(attributeName1, attributeName2, ...)`

* `D365Event.Lookup` — lookup control events (one or many lookup control names):

  * `OnTagClick(controlName1, ...)`
  * `OnPreSearch(controlName1, ...)`

* `D365Event.SubGrid` — subgrid events (one or many grid names):

  * `OnLoad(gridName1, ...)`
  * `OnRecordSelected(gridName1, ...)`

* `D365Event.IFrame` — iframe-ready event (one or many webresource names):

  * `OnReadyStateComplete(webResourceName1, ...)`

* `D365Event.Process` — BPF events:

  * `OnStatusChange()`
  * `OnPreStatusChange()`
  * `OnPreStageChange()`
  * `OnStageChange()`
  * `OnStageSelected()`

* `D365Event.PCF` — PCF control events (one or many control names):

  * `OnOutputChange(controlName1, ...)`

* `D365Event.KnowledgeBaseSearch` — knowledge base search events (one or many control names):

  * `OnResultOpened(controlName1, ...)`
  * `OnSelection(controlName1, ...)`
  * `PostSearch(controlName1, ...)`

* `D365Event.Filter.FormTypes(formTypes1, ...)` — optional filter decorator to restrict a handler to specific form types. **Note:** you may pass `XrmEnum.FormType.Create` or its numeric equivalent (for example `1`) — Dynamics form type constants are numeric under the hood.

**Decorator behavior**

Decorators register metadata into an in-memory registry (no metadata reflection dependency). At runtime, when an instance of a `FormEventHandlerBase` derived class is created, the `FormEventDispatcher` reads this registry and attaches the declared handlers to the actual form or controls.

---

## Runtime pieces

Major runtime modules included in this library:

* **`DecoratorProfiler`** — collects initialization duration for decorator upserts.
* **`Registry`** — stores per-constructor event metadata and exposes `getFormEvents` and `upsertFunctionEvent`.
* **`Dispatcher`** — `FormEventDispatcher` attaches handlers to the form and component APIs using helpers from `@sguez/d365-form-helpers`.
* **`HandlerBase`** — base class (`FormEventHandlerBase`) that you extend and instantiate in `onLoad` to wire events.

---

## Examples

Below are examples showing usage for each decorator category. In all examples the handler method receives the `executionContext: Xrm.Events.EventContext` parameter and the form-level instantiation uses `executionContext`.

### Form events

```ts
class FormExamples extends FormEventHandlerBase {
  @D365Event.Form.OnLoad()
  onLoadHandler(executionContext: Xrm.Events.EventContext) {
    // called on form load
  }

  @D365Event.Form.OnDataLoad()
  onDataLoadHandler(executionContext: Xrm.Events.EventContext) {
    // called when form data is loaded
  }

  @D365Event.Form.Loaded()
  onLoadedHandler(executionContext: Xrm.Events.EventContext) {
    // called after the form UI is fully rendered
  }

  @D365Event.Form.OnSave()
  onSaveHandler(executionContext: Xrm.Events.EventContext) {
    // called during save
  }

  @D365Event.Form.OnPostSave()
  onPostSaveHandler(executionContext: Xrm.Events.EventContext) {
    // called after save completes
  }
}
```

### Tab events

```ts
class TabExamples extends FormEventHandlerBase {
  @D365Event.Tab.OnStateChange("tab_general", "tab_details")
  onAnyTabStateChange(executionContext: Xrm.Events.EventContext) {
    // called when tab_general or tab_details expand/collapse
  }

  @D365Event.Tab.OnExpand("tab_general")
  onTabExpand(executionContext: Xrm.Events.EventContext) {
    // called only when tab_general becomes expanded
  }

  @D365Event.Tab.OnCollapse("tab_details")
  onTabCollapse(executionContext: Xrm.Events.EventContext) {
    // called only when tab_details becomes collapsed
  }
}
```

### Column/Attribute events

```ts
class ColumnExamples extends FormEventHandlerBase {
  @D365Event.Column.OnChange("firstname", "lastname")
  onNameChanged(executionContext: Xrm.Events.EventContext) {
    // called when either firstname or lastname changes
  }
}
```

### Lookup events

```ts
class LookupExamples extends FormEventHandlerBase {
  @D365Event.Lookup.OnTagClick("primarycontactid")
  onLookupTagClick(executionContext: Xrm.Events.EventContext) {
    // called when a tag is clicked on the lookup
  }

  @D365Event.Lookup.OnPreSearch("parentaccountid")
  onLookupPreSearch(executionContext: Xrm.Events.EventContext) {
    // called before lookup search executes
  }
}
```

### SubGrid events

```ts
class SubGridExamples extends FormEventHandlerBase {
  @D365Event.SubGrid.OnLoad("contactsGrid")
  onSubGridLoad(executionContext: Xrm.Events.EventContext) {
    // called when the subgrid has loaded
  }

  @D365Event.SubGrid.OnRecordSelected("contactsGrid")
  onSubGridRecordSelect(executionContext: Xrm.Events.EventContext) {
    // called when a record is selected in the subgrid
  }
}
```

### IFrame events

```ts
class IFrameExamples extends FormEventHandlerBase {
  @D365Event.IFrame.OnReadyStateComplete("webResource_myframe")
  onIFrameReady(executionContext: Xrm.Events.EventContext) {
    // access via formContext.getControl("webResource_myframe").getContentWindow()
    const formContext = executionContext.getFormContext();
    formContext.getControl("webResource_myframe")?.getContentWindow().then(
        function (contentWindow) {
            contentWindow.doStuff();
        }
    )
  }
}
```

### Process (BPF) events

```ts
class ProcessExamples extends FormEventHandlerBase {
  @D365Event.Process.OnStatusChange()
  onProcessStatusChange(executionContext: Xrm.Events.EventContext) {
    // called when process status changes
  }

  @D365Event.Process.OnPreStatusChange()
  onPreStatusChange(executionContext: Xrm.Events.EventContext) {
    // called before the status change is applied
  }

  @D365Event.Process.OnPreStageChange()
  onPreStageChange(executionContext: Xrm.Events.EventContext) {
    // called before stage change
  }

  @D365Event.Process.OnStageChange()
  onStageChange(executionContext: Xrm.Events.EventContext) {
    // called when active stage changes
  }

  @D365Event.Process.OnStageSelected()
  onStageSelected(executionContext: Xrm.Events.EventContext) {
    // called when a stage is explicitly selected
  }
}
```

### PCF control events

```ts
class PCFExamples extends FormEventHandlerBase {
  @D365Event.PCF.OnOutputChange("pcf_currency")
  onPcfOutputChange(executionContext: Xrm.Events.EventContext) {
    // called when a PCF control notifies an output change
  }
}
```

### Knowledge Base Search events

```ts
class KbExamples extends FormEventHandlerBase {
  @D365Event.KnowledgeBaseSearch.OnResultOpened("kbSearch1")
  onKbResultOpened(executionContext: Xrm.Events.EventContext) {
    // called when a KnowledgeBase search result is opened
  }

  @D365Event.KnowledgeBaseSearch.OnSelection("kbSearch1")
  onKbSelection(executionContext: Xrm.Events.EventContext) {
    // called when a KnowledgeBase search result is selected
  }

  @D365Event.KnowledgeBaseSearch.PostSearch("kbSearch1")
  onKbPostSearch(executionContext: Xrm.Events.EventContext) {
    // called after a KnowledgeBase search finishes
  }
}
```

### Filter decorator with numeric form type

```ts
class FilterExamples extends FormEventHandlerBase {
  // You can use the enum or the numeric value (Create is 1)
  @D365Event.Filter.FormTypes(XrmEnum.FormType.Create)
  @D365Event.Form.OnLoad()
  onCreateOnlyLoad(executionContext: Xrm.Events.EventContext) {
    // runs only if form type is Create (enum or numeric 1)
  }
}
```

---

## Debugging & Profiling

The library provides simple debugging helpers and a profiling utility.

* `FormEventHandlerBase.logRegisteredFormEvents()` — prints all registered handlers for the class instance.  
  This method uses `console.debug` to output information. In many browsers this output is visible only when the DevTools logging level is set to **Verbose**.

* `FormEventHandlerBase.logDecoratorProfilingTimes()` — prints measured decorator initialization time (aggregated via `DecoratorProfiler.total()`) and the time taken to attach events for the current instance.  
  This method also uses `console.debug` and therefore appears when DevTools logging level is **Verbose**.

### Example

In your form script:

```ts
export function onLoad(executionContext: Xrm.Events.EventContext) {
    const handlerClass = new ContactFormHandler(executionContext);

    // Debug: list all registered event handlers for this form
    handlerClass.logRegisteredFormEvents();

    // Profiling: show decorator initialization and attach timings
    handlerClass.logDecoratorProfilingTimes();
}
```

When DevTools logging level is set to **Verbose**, the console will show:

* Each decorated handler (function name, event types, component names, applicable form types)
* Initialization and attach timings in milliseconds


**Warning aggregation**

When a decorator references a control/tab/attribute name that cannot be found on the current form, the library aggregates these warnings and emits grouped `console.warn` entries instead of spamming the console for every missing item.

---

## Known Issues (Dynamics-specific)

These are not limitations of the library but quirks of Dynamics 365 itself:

* **OnLoad** → corresponds to the **Form Loaded** event in the user interface.
* **OnDataLoad** → triggered after **OnLoad** on the first load. By design, only the **Form Load** event is configurable in the form editor.
* **Lookup Events** → only applied to the *first* duplicated control bound to an attribute. They will not fire for duplicated controls (`controlName1`, `controlName2`, etc.), only for the original attribute control.
