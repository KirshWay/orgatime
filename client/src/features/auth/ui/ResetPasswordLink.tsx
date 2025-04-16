import { useState } from "react";
import { Check, Copy, Link, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type ResetPasswordLinkProps = {
  resetUrl: string;
  onBack: () => void;
};

export const ResetPasswordLink: React.FC<ResetPasswordLinkProps> = ({
  resetUrl,
  onBack,
}) => {
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    window.open(resetUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
        <AlertTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Link for reset password generated
        </AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          Use this link to reset your password. The link is valid for 1 hour.
        </AlertDescription>
      </Alert>

      {showInput ? (
        <div className="mt-2">
          <Input
            type="text"
            value={resetUrl}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click the button below to copy the link for password reset or show it.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleCopyLink} className="flex-1">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy link
            </>
          )}
        </Button>

        <Button
          variant={showInput ? "default" : "outline"}
          onClick={() => setShowInput(!showInput)}
          className="flex-1"
        >
          <Link className="mr-2 h-4 w-4" />
          {showInput ? "Hide link" : "Show link"}
        </Button>

        <Button variant="default" onClick={handleOpenLink} className="flex-1">
          Open in new tab
        </Button>
      </div>

      <div className="mt-6">
        <Button variant="ghost" onClick={onBack} className="w-full">
          Back to login page
        </Button>
      </div>
    </div>
  );
};
