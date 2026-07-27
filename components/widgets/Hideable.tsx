import type { ReactNode } from "react";
import type { WidgetKey } from "@/lib/widgets-types";
import HideWidgetButton from "./HideWidgetButton";

/**
 * Wraps a widget so it can be dismissed from its own corner.
 *
 * The [X] is positioned over the widget's header rather than being added to
 * each of the 30-odd widgets' own markup — those headers are near-identical
 * but not identical, and editing every one of them to thread a button through
 * would be a much larger change for the same result.
 *
 * A widget that renders nothing (LatestNews with no news, PollSidebarLatest
 * with no closed poll, anything still suspended) must not leave a stray [X]
 * floating in the gap. That is handled in CSS: .widget-hide-btn is hidden
 * unless its frame also contains a real child — see .widget-frame:has(...) in
 * assets/css/site.css. Doing it in CSS keeps this a plain server component;
 * React cannot tell whether an async child will render anything.
 *
 * Anonymous visitors have nowhere to store the preference, so they get the
 * widget with no button.
 */
export default function Hideable({
  widgetKey,
  canHide,
  children,
}: {
  widgetKey: WidgetKey;
  canHide: boolean;
  children: ReactNode;
}) {
  if (!canHide) return <>{children}</>;
  return (
    <div className="widget-frame">
      <HideWidgetButton widgetKey={widgetKey} />
      {children}
    </div>
  );
}
