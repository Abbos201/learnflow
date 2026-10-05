'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

import { createStudents } from '@/app/admin/actions';

type StudentRow = {
  id: string;
  name: string;
  password: string;
};

function createRow(): StudentRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    password: '',
  };
}

export function StudentBulkForm() {
  const [rows, setRows] = useState<StudentRow[]>([
    createRow(),
    createRow(),
    createRow(),
  ]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  function updateRow(
    id: string,
    field: 'name' | 'password',
    value: string
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      createRow(),
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((row) => row.id !== id);
    });
  }

  function addMany(count: number) {
    setRows((current) => [
      ...current,
      ...Array.from(
        { length: count },
        () => createRow()
      ),
    ]);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);

    const validRows = rows
      .map((row) => ({
        name: row.name.trim(),
        password: row.password,
      }))
      .filter((row) => row.name || row.password);

    if (validRows.length === 0) {
      setMessage({
        type: 'error',
        text: 'Kamida bitta o‘quvchi kiriting.',
      });
      return;
    }

    const emptyName = validRows.find(
      (row) => !row.name
    );

    if (emptyName) {
      setMessage({
        type: 'error',
        text: 'Har bir o‘quvchining ismini kiriting.',
      });
      return;
    }

    const shortPassword = validRows.find(
      (row) => row.password.length < 6
    );

    if (shortPassword) {
      setMessage({
        type: 'error',
        text: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.',
      });
      return;
    }

    if (validRows.length > 100) {
      setMessage({
        type: 'error',
        text: 'Bir martada ko‘pi bilan 100 ta o‘quvchi qo‘shish mumkin.',
      });
      return;
    }

    setSaving(true);

    try {
      const result = await createStudents(validRows);

      if (!result.ok) {
        setMessage({
          type: 'error',
          text: result.error,
        });
        return;
      }

      setMessage({
        type: 'success',
        text: `${result.count} ta o‘quvchi muvaffaqiyatli qo‘shildi.`,
      });

      setRows([
        createRow(),
        createRow(),
        createRow(),
      ]);
    } catch (error) {
      console.error(error);

      setMessage({
        type: 'error',
        text: 'O‘quvchilarni qo‘shishda xatolik yuz berdi.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                O‘quvchilar
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Ism va parolni kiriting. Login avtomatik yaratiladi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addMany(10)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
              >
                +10 qator
              </button>

              <button
                type="button"
                onClick={() => addMany(20)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
              >
                +20 qator
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="hidden grid-cols-[1fr_1fr_52px] gap-3 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid">
            <div>O‘quvchi ismi</div>
            <div>Parol</div>
            <div />
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-gray-200 bg-white p-3 sm:grid sm:grid-cols-[1fr_1fr_52px] sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0"
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">
                    {index + 1}. O‘quvchi ismi
                  </label>

                  <input
                    type="text"
                    value={row.name}
                    onChange={(event) =>
                      updateRow(
                        row.id,
                        'name',
                        event.target.value
                      )
                    }
                    // placeholder="Masalan: Ali Valiyev"
                    disabled={saving}
                    className="input w-full"
                    autoComplete="off"
                  />
                </div>

                <div className="mt-3 sm:mt-0">
                  <label className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">
                    Parol
                  </label>

                  <input
                    type="text"
                    value={row.password}
                    onChange={(event) =>
                      updateRow(
                        row.id,
                        'password',
                        event.target.value
                      )
                    }
                    placeholder="Kamida 6 ta belgi"
                    disabled={saving}
                    className="input w-full"
                    autoComplete="new-password"
                  />
                </div>

                <div className="mt-3 flex justify-end sm:mt-0 sm:justify-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={
                      saving || rows.length === 1
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Qatorni o‘chirish"
                    aria-label="Qatorni o‘chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Yana o‘quvchi qo‘shish
          </button>
        </div>
      </div>

      {message && (
        <div
          className={
            message.type === 'success'
              ? 'rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700'
              : 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
          }
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setRows([
              createRow(),
              createRow(),
              createRow(),
            ]);
            setMessage(null);
          }}
          disabled={saving}
          className="btn btn-secondary"
        >
          Tozalash
        </button>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              O‘quvchilarni saqlash
            </>
          )}
        </button>
      </div>
    </form>
  );
}