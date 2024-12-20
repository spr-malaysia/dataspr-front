import { Transition, Dialog } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { clx } from "@lib/helpers";
import { Fragment, FunctionComponent, ReactNode, useState } from "react";

type TooltipProps = {
  children?: (open: () => void) => ReactNode;
  className?: string;
  position?: string;
  tip: ReactNode;
};

const Tooltip: FunctionComponent<TooltipProps> = ({ children, className, position, tip }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group relative">
      {children ? (
        children(() => setIsOpen(true))
      ) : (
        <>
          {Boolean(tip) && (
            <>
              <InformationCircleIcon
                className={clx("text-slate-400 mb-1 hidden h-4 w-4 md:inline-block", className)}
              />
              <InformationCircleIcon
                className={clx("text-slate-400 mb-1 inline-block h-4 w-4 md:hidden", className)}
                onClick={() => setIsOpen(true)}
              />
            </>
          )}
        </>
      )}
      <div className={clx("invisible absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 transform flex-col items-center group-hover:visible group-hover:flex lg:flex", position)}>
        <span
          className={clx(
            "shadow-floating absolute bottom-1 w-max max-w-[200px] rounded-lg bg-zinc-900 px-3 py-2 text-sm font-normal text-white dark:bg-white dark:text-zinc-900",
            className
          )}
        >
          {tip}
        </span>
        <div className="h-2 w-2 rotate-45 bg-zinc-900 dark:bg-white"></div>
      </div>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className={clx("relative z-10")}
          onClose={setIsOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-900 bg-opacity-90 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="shadow-floating relative h-fit w-max max-w-[200px] transform rounded-lg bg-zinc-900 px-3 py-1.5 text-left text-sm text-white transition-all dark:bg-white dark:text-zinc-900">
                  {tip}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};
export default Tooltip;
