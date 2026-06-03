"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { formatDisplayDate } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AccountPage() {
  const router = useRouter();
  const {
    currentAccount,
    isAdmin,
    data,
    logout,
    deleteAccountById,
    removeMatchById,
  } = useAppData();

  if (!currentAccount) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">帳號</h2>
      <p className="text-sm text-gray-500 mb-4">
        目前登入：<span className="text-arena-neon">{currentAccount.name}</span>
        {isAdmin && (
          <span className="ml-2 text-xs text-arena-purple">管理員</span>
        )}
      </p>

      <Button
        variant="secondary"
        fullWidth
        className="mb-6"
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        登出
      </Button>

      {isAdmin && (
        <>
          <section className="mb-6">
            <h3 className="text-sm font-bold text-arena-purple mb-2">
              管理員：刪除比賽紀錄
            </h3>
            {data.matches.length === 0 ? (
              <p className="text-gray-600 text-sm">尚無比賽</p>
            ) : (
              data.matches.map((m) => (
                <Card
                  key={m.id}
                  className="mb-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatDisplayDate(m.date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-red-400 shrink-0"
                    onClick={() => removeMatchById(m.id)}
                  >
                    刪除
                  </button>
                </Card>
              ))
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-arena-purple mb-2">
              管理員：刪除帳號
            </h3>
            {data.accounts
              .filter((a) => a.id !== currentAccount.id)
              .map((account) => (
                <Card
                  key={account.id}
                  className="mb-2 flex items-center justify-between gap-2"
                >
                  <span>{account.name}</span>
                  <button
                    type="button"
                    className="text-sm text-red-400 px-3 py-1"
                    onClick={() => deleteAccountById(account.id)}
                  >
                    刪除
                  </button>
                </Card>
              ))}
          </section>
        </>
      )}

      <Link href="/" className="block mt-6">
        <Button variant="ghost" fullWidth>
          返回首頁
        </Button>
      </Link>
    </div>
  );
}
