import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useResponsiveLabels({
  containerRef,
  sortButtonRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  sortButtonRef: React.RefObject<HTMLElement | null>;
}) {
  const sortLabelRef = useRef<HTMLSpanElement | null>(null);
  const filterLabelRef = useRef<HTMLSpanElement | null>(null);

  const [showSortLabel, setShowSortLabel] = useState(false);
  const [showFilterLabel, setShowFilterLabel] = useState(false);

  const recompute = useCallback(() => {
    const container = containerRef.current as HTMLElement | null;
    if (!container) {
      setShowSortLabel(false);
      setShowFilterLabel(false);
      return;
    }

    const clientW = container.clientWidth;
    if (clientW <= 0) {
      setShowSortLabel(false);
      setShowFilterLabel(false);
      return;
    }

    // Measure label widths regardless of visibility
    const sortLabelW = sortLabelRef.current?.offsetWidth ?? 0;
    const filterLabelW = filterLabelRef.current?.offsetWidth ?? 0;

    // Baseline width WITHOUT labels (subtract if currently shown)
    let baseline = container.scrollWidth;
    if (showSortLabel) baseline -= sortLabelW;
    if (showFilterLabel) baseline -= filterLabelW;

    // Only show Sort when the current content fits AND adding the label still fits
    const canShowSort = baseline <= clientW && baseline + sortLabelW <= clientW;

    // Only show Filter when Sort is shown AND adding Filter also still fits
    const canShowFilter = canShowSort && baseline + sortLabelW + filterLabelW <= clientW;

    setShowSortLabel(canShowSort);
    setShowFilterLabel(canShowFilter);
  }, [containerRef, showSortLabel, showFilterLabel]);

  useLayoutEffect(() => {
    // Initial computation after first paint
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = containerRef.current as HTMLElement | null;
    const sortBtn = sortButtonRef.current as HTMLElement | null;
    if (!container) return;

    const ro = new ResizeObserver(() => recompute());
    ro.observe(container);
    if (sortBtn) ro.observe(sortBtn);

    const onResize = () => recompute();
    window.addEventListener("resize", onResize);

    // Recompute on next frame as layout may stabilize after transitions
    const raf = requestAnimationFrame(recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [containerRef, sortButtonRef, recompute]);

  return { sortLabelRef, filterLabelRef, showSortLabel, showFilterLabel } as const;
}
