// File Path: src/components/pipeline/components/NavigationConfirmation.tsx
// Filename: NavigationConfirmation.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { NavigationConfirmationProps } from '../types/IFlowTypes';

export const NavigationConfirmation: React.FC<NavigationConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Navigation",
  message = "Ensure to modify and save the correct configurations as per next Environment before going to Next step. Are you sure to goto next step?"
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            No
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};