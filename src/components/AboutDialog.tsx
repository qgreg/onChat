import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'rgba(22, 22, 30, 0.96)',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(20px)',
          },
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between gap-4 border-b border-white/10">
        <span className="flex items-center gap-3 text-white">
          <InfoOutlinedIcon className="text-indigo-300" />
          About onChat
        </span>
        <IconButton aria-label="Close about dialog" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent className="space-y-5 pt-6 text-sm leading-relaxed text-gray-300">
        <p>
          onChat runs prompts through browser-native local AI APIs. The app does not send chat messages
          to a hosted model service.
        </p>
        <p>
          Chrome is currently the recommended browser. Edge exposes compatible built-in AI APIs in some
          builds, but may return unreadable output while Microsoft's implementation is still in developer
          preview.
        </p>
        <p>
          The project was initially prompted by Greg Quinlan from Antigravity and subsequently developed
          with Codex. The name onChat was coined by Ian Lurie.
        </p>
      </DialogContent>
    </Dialog>
  );
}
