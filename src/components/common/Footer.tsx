"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              © 2024 株式会社プラスツーシステム. All rights reserved.
            </div>
            <div>
              <Button
                variant="link"
                onClick={() => setIsContactDialogOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                お問合せはこちら
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>お問合せ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">電話番号</h3>
              <p className="text-lg">03-1234-5678</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">メールアドレス</h3>
              <p className="text-lg">info@plus2system.co.jp</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};