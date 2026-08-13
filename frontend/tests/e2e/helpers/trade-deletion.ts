import { expect, type Locator, type Page } from "@playwright/test";

type OpenDeletionConfirmationOptions = Readonly<{
  count: number;
  page: Page;
  side: "매수" | "매도";
  trigger: Locator;
}>;

export async function openDeletionConfirmation({
  count,
  page,
  side,
  trigger,
}: OpenDeletionConfirmationOptions): Promise<Locator> {
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: `${side} 기록 삭제` });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(`선택한 ${count}건의 ${side} 기록을 삭제할까요?`);
  return dialog;
}

export async function submitDeletionConfirmation(dialog: Locator): Promise<void> {
  await dialog.getByLabel("삭제 확인").fill("삭제");
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();
}
