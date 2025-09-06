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
    const sortBtn = sortButtonRef.current as HTMLElement | null;
    if (!container || !sortBtn) {
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

    // Measure visibility based on the scroll viewport of the container
    const containerRect = container.getBoundingClientRect();
    const sortRect = sortBtn.getBoundingClientRect();

    // Space to the right of the sort button within the container viewport
    const availableRight = containerRect.right - sortRect.right;
    const leftVisible = sortRect.left >= containerRect.left;
    const rightVisible = sortRect.right <= containerRect.right;
    const sortFullyVisible = leftVisible && rightVisible;

    // Responsive margin-left that will apply when labels are visible
    const ml =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(min-width: 1536px)").matches
          ? 32
          : window.matchMedia("(min-width: 1280px)").matches
          ? 16
          : 0
        : 0;

    // If Sort is currently hidden, we need extra space equal to the label width + margin
    const needForSort = sortLabelW + ml;
    const extraIfSortHidden = showSortLabel ? 0 : needForSort;

    // Showing Filter pushes everything to the right as well, so require the combined space
    const needForBoth = extraIfSortHidden + filterLabelW + ml;

    const nextShowSort = sortFullyVisible && availableRight >= extraIfSortHidden;
    const nextShowFilter = nextShowSort && availableRight >= needForBoth;

    setShowSortLabel(nextShowSort);
    setShowFilterLabel(nextShowFilter);
  }, [containerRef, sortButtonRef, showSortLabel]);

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
    const onScroll = () => recompute();
    window.addEventListener("resize", onResize);
    container.addEventListener("scroll", onScroll, { passive: true });

    // Recompute on next frame as layout may stabilize after transitions
    const raf = requestAnimationFrame(recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [containerRef, sortButtonRef, recompute]);

  return { sortLabelRef, filterLabelRef, showSortLabel, showFilterLabel } as const;
}
