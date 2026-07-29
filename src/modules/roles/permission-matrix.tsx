"use client";

import {
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  buildPermissionName,
} from "@/lib/permission-catalog";

type PermissionMatrixProps = {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  lockedPermissionNames?: string[];
  onChange?: (permissionNames: string[]) => void;
  permissionNames: string[];
  readOnly?: boolean;
};

const panelClassName =
  "min-w-0 rounded-[1.5rem] border border-stone-200/90 bg-white/80 p-4 shadow-[0_8px_24px_rgba(80,58,29,0.04)]";

export function PermissionMatrix({
  disabled = false,
  error,
  helperText,
  lockedPermissionNames = [],
  onChange,
  permissionNames,
  readOnly = false,
}: PermissionMatrixProps) {
  const selectedPermissions = new Set(permissionNames);
  const lockedPermissions = new Set(lockedPermissionNames);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-700">
            Matriz de permisos
          </p>
          <p className="text-xs break-words text-stone-500">
            Asigne accesos por recurso para mantener cada perfil claro y facil
            de auditar.
          </p>
        </div>
        <div className="max-w-full rounded-full bg-stone-100 px-3 py-1 text-center text-xs font-semibold tracking-[0.18em] break-words text-stone-600 uppercase">
          {selectedPermissions.size} activos
        </div>
      </div>

      {helperText ? (
        <div className="rounded-[1.2rem] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
          {helperText}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PERMISSION_RESOURCES.map((resource) => (
          <section key={resource.key} className={panelClassName}>
            <div className="mb-4">
              <h3 className="text-base font-semibold break-words text-stone-950">
                {resource.label}
              </h3>
              <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                Permisos del recurso
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PERMISSION_ACTIONS.map((action) => {
                const permissionName = buildPermissionName(
                  resource.key,
                  action.key,
                );
                const isLocked = lockedPermissions.has(permissionName);
                const isChecked = selectedPermissions.has(permissionName);

                return (
                  <label
                    key={permissionName}
                    className={`flex min-w-0 items-start gap-3 rounded-[1.25rem] border px-3 py-3 transition ${
                      isChecked
                        ? "border-amber-300/80 bg-amber-50/70"
                        : "border-stone-200/90 bg-stone-50/60"
                    }`}
                  >
                    <input
                      checked={isChecked}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-300"
                      disabled={disabled || readOnly || isLocked}
                      onChange={(event) => {
                        if (!onChange) {
                          return;
                        }

                        const nextPermissions = event.target.checked
                          ? [...permissionNames, permissionName]
                          : permissionNames.filter(
                              (value) => value !== permissionName,
                            );

                        onChange(Array.from(new Set(nextPermissions)));
                      }}
                      type="checkbox"
                    />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-sm font-semibold break-words text-stone-900">
                        {action.label}
                      </span>
                      <span className="block text-xs break-all text-stone-500">
                        {permissionName}
                      </span>
                      {isLocked ? (
                        <span className="block text-[11px] font-semibold tracking-[0.16em] text-amber-700 uppercase">
                          Protegido
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
