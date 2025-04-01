import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface BottomSheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  handleClassName?: string;
}

const BottomSheet = React.forwardRef<
  HTMLDivElement,
  BottomSheetProps
>(
  (
    {
      open,
      onOpenChange,
      snapPoints = [0.5, 0.9],
      defaultSnapPoint = 0,
      children,
      className,
      overlayClassName,
      handleClassName,
      ...props
    },
    ref
  ) => {
    const [currentSnapPoint, setCurrentSnapPoint] = React.useState(defaultSnapPoint);
    const sheetRef = React.useRef<HTMLDivElement>(null);
    const [sheetHeight, setSheetHeight] = React.useState(0);

    React.useEffect(() => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.scrollHeight);
      }
    }, [open, children]);

    const getYPosition = (snapPointIndex: number) => {
      if (!snapPoints || snapPointIndex < 0 || snapPointIndex >= snapPoints.length) {
        return 0;
      }
      const vh = window.innerHeight;
      const snapPoint = snapPoints[snapPointIndex];
      return vh - (vh * snapPoint);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { velocity, offset } = info;
      const currentPosition = getYPosition(currentSnapPoint);
      const currentOffset = currentPosition + offset.y;

      // Calculate which snap point is closest
      const distances = snapPoints.map((_, index) => {
        return Math.abs(currentOffset - getYPosition(index));
      });

      let closestSnapPointIndex = distances.indexOf(Math.min(...distances));

      // If velocity is high enough, move in direction of drag
      if (Math.abs(velocity.y) > 500) {
        if (velocity.y > 0) {
          // Swiping down, go to next lower snap point
          closestSnapPointIndex = Math.min(snapPoints.length - 1, currentSnapPoint + 1);
        } else {
          // Swiping up, go to next higher snap point
          closestSnapPointIndex = Math.max(0, currentSnapPoint - 1);
        }
      }

      // If we're at the bottom snap point and dragging down further, close the sheet
      if (
        currentSnapPoint === snapPoints.length - 1 &&
        offset.y > 50 &&
        velocity.y > 0
      ) {
        onOpenChange?.(false);
        return;
      }

      setCurrentSnapPoint(closestSnapPointIndex);
    };

    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={cn(
                "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
                overlayClassName
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange?.(false)}
            />
            <motion.div
              ref={sheetRef}
              className={cn(
                "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background shadow-lg",
                className
              )}
              initial={{ y: "100%" }}
              animate={{ y: getYPosition(currentSnapPoint) }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              {...props}
            >
              <div
                className={cn(
                  "w-full flex justify-center p-2",
                  handleClassName
                )}
              >
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

export { BottomSheet };
