import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

interface SaveChangesDialogProps {
  open: boolean;
  onClose: (choice: "yes" | "no" | "cancel") => void;
}

export const SaveChangesDialog: React.FC<SaveChangesDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => onClose("cancel")}
      aria-labelledby="save-changes-dialog-title"
      aria-describedby="save-changes-dialog-description"
    >
      <DialogTitle id="save-changes-dialog-title">Save Changes?</DialogTitle>
      <DialogContent>
        <DialogContentText id="save-changes-dialog-description">
          Save changes to current configuration before creating a new one?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose("yes")} color="primary">
          Yes
        </Button>
        <Button onClick={() => onClose("no")} color="primary">
          No
        </Button>
        <Button onClick={() => onClose("cancel")} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
