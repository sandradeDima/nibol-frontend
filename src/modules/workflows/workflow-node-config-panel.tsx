"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Braces,
  Check,
  ChevronDown,
  CircleAlert,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type {
  ApprovalNodeConfiguration,
  ConditionNodeConfiguration,
  EndNodeConfiguration,
  EscalationNodeConfiguration,
  NotificationNodeConfiguration,
  RejectionNodeConfiguration,
  SlaNodeConfiguration,
  StageNodeConfiguration,
  StartNodeConfiguration,
  WorkflowAssignmentStrategy,
  WorkflowConditionField,
  WorkflowConditionOperator,
  WorkflowDesignerNode,
  WorkflowDesignerNodeConfiguration,
  WorkflowDesignerOptions,
  WorkflowSlaInline,
} from "@/types";

import {
  ASSIGNMENT_STRATEGY_LABELS,
  CONDITION_FIELD_LABELS,
  CONDITION_OPERATOR_LABELS,
  NODE_TYPE_LABELS,
  cloneConfiguration,
  validateConfiguration,
} from "./workflow-designer-config";

type NodeConfigPanelProps = {
  node: WorkflowDesignerNode | null;
  nodes: WorkflowDesignerNode[];
  onApply: (
    nodeId: string,
    configuration: WorkflowDesignerNodeConfiguration,
  ) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  options: WorkflowDesignerOptions | undefined;
  processType: string;
  readOnly: boolean;
};

const ASSIGNMENT_STRATEGIES: WorkflowAssignmentStrategy[] = [
  "FIXED_USER",
  "ROLE",
  "AREA",
  "RECORD_OWNER",
  "OBSERVATION_RESPONSIBLE",
  "REQUESTER",
  "SUPERVISOR",
  "FIELD_REFERENCE",
];

const CONDITION_FIELDS: WorkflowConditionField[] = [
  "riskLevel",
  "observationStatus",
  "areaId",
  "processType",
  "responsibleUserId",
  "dueDate",
  "daysOverdue",
  "hasEvidence",
  "evidenceCount",
  "remediationPlanStatus",
  "requestType",
  "requestedExtensionDays",
  "previousDecision",
];

const CONDITION_OPERATORS: WorkflowConditionOperator[] = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN_OR_EQUAL",
  "CONTAINS",
  "NOT_CONTAINS",
  "IS_EMPTY",
  "IS_NOT_EMPTY",
  "IN",
  "NOT_IN",
  "IS_OVERDUE",
  "DUE_WITHIN",
];

const isValueFreeOperator = (operator: WorkflowConditionOperator) =>
  ["IS_EMPTY", "IS_NOT_EMPTY", "IS_OVERDUE"].includes(operator);

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-[var(--foreground-soft)]">
        {label}{" "}
        {required ? <span className="text-[var(--accent)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-4 border-t border-[var(--border)] pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-bold tracking-[0.18em] text-[var(--muted)] uppercase">
        {title}
      </h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TextInput({
  disabled,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "number" | "text";
  value: number | string | null | undefined;
}) {
  return (
    <input
      className="nibol-field h-10 py-2 text-sm"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value ?? ""}
    />
  );
}

function SelectInput({
  children,
  disabled,
  onChange,
  value,
}: {
  children: ReactNode;
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string | null | undefined;
}) {
  return (
    <select
      className="nibol-field h-10 py-2 text-sm"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value ?? ""}
    >
      {children}
    </select>
  );
}

function Checkbox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-[var(--foreground-soft)]">
      <input
        checked={checked}
        className="h-4 w-4 accent-[var(--primary)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function ActionChecks({
  actions,
  disabled,
  labels,
  onChange,
}: {
  actions: string[];
  disabled: boolean;
  labels: Record<string, string>;
  onChange: (actions: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(labels).map(([key, label]) => (
        <Checkbox
          checked={actions.includes(key)}
          disabled={disabled}
          key={key}
          label={label}
          onChange={(checked) => {
            onChange(
              checked
                ? [...actions, key]
                : actions.filter((action) => action !== key),
            );
          }}
        />
      ))}
    </div>
  );
}

function AssignmentFields({
  configuration,
  disabled,
  onChange,
  options,
}: {
  configuration: StageNodeConfiguration | ApprovalNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  const assignmentStrategies = options?.assignmentStrategies.length
    ? options.assignmentStrategies
    : ASSIGNMENT_STRATEGIES.map((key) => ({
        key,
        label: ASSIGNMENT_STRATEGY_LABELS[key],
      }));

  return (
    <div className="grid gap-4">
      <Field label="Estrategia de asignación" required>
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("assignmentStrategy", value || null)}
          value={configuration.assignmentStrategy}
        >
          <option value="">Seleccione una estrategia</option>
          {assignmentStrategies.map((strategy) => (
            <option key={strategy.key} value={strategy.key}>
              {strategy.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      {configuration.assignmentStrategy === "FIXED_USER" ? (
        <Field label="Usuario">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("userId", value || null)}
            value={configuration.userId}
          >
            <option value="">Seleccione un usuario</option>
            {options?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      {configuration.assignmentStrategy === "ROLE" ? (
        <Field label="Rol">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("roleId", value || null)}
            value={configuration.roleId}
          >
            <option value="">Seleccione un rol</option>
            {options?.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      {configuration.assignmentStrategy === "AREA" ? (
        <Field label="Área">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("areaId", value || null)}
            value={configuration.areaId}
          >
            <option value="">Seleccione un área</option>
            {options?.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      {configuration.assignmentStrategy === "FIELD_REFERENCE" ? (
        <Field label="Referencia por campo">
          <TextInput
            disabled={disabled}
            onChange={(value) => onChange("fieldReference", value || null)}
            placeholder="Ej. ownerUserId"
            value={configuration.fieldReference}
          />
        </Field>
      ) : null}

      <div className="grid gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Fallback
        </p>
        <Field label="Estrategia de respaldo">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("fallbackStrategy", value || null)}
            value={configuration.fallbackStrategy}
          >
            <option value="">Sin fallback</option>
            <option value="STOP">Detener con error de configuración</option>
            <option value="ROLE">Asignar a un rol</option>
            <option value="USER">Asignar a un usuario</option>
            <option value="ADMINISTRATOR">Escalar al administrador</option>
          </SelectInput>
        </Field>
        {configuration.fallbackStrategy === "ROLE" ? (
          <Field label="Rol de respaldo">
            <SelectInput
              disabled={disabled}
              onChange={(value) => onChange("fallbackRoleId", value || null)}
              value={configuration.fallbackRoleId}
            >
              <option value="">Seleccione un rol</option>
              {options?.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
        {configuration.fallbackStrategy === "USER" ? (
          <Field label="Usuario de respaldo">
            <SelectInput
              disabled={disabled}
              onChange={(value) => onChange("fallbackUserId", value || null)}
              value={configuration.fallbackUserId}
            >
              <option value="">Seleccione un usuario</option>
              {options?.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
      </div>
    </div>
  );
}

function SlaFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: WorkflowSlaInline | null;
  disabled: boolean;
  onChange: (configuration: WorkflowSlaInline | null) => void;
}) {
  const sla = configuration ?? {
    duration: 24,
    escalationEnabled: false,
    escalationThreshold: null,
    reminderEnabled: false,
    reminderThreshold: null,
    unit: "HOURS" as const,
  };

  const update = (key: keyof WorkflowSlaInline, value: unknown) => {
    onChange({ ...sla, [key]: value } as WorkflowSlaInline);
  };

  return (
    <div className="grid gap-4 border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="grid gap-4 sm:grid-cols-[0.8fr_1fr]">
        <Field label="Duración">
          <TextInput
            disabled={disabled}
            onChange={(value) => update("duration", Number(value) || 0)}
            type="number"
            value={sla.duration}
          />
        </Field>
        <Field label="Unidad">
          <SelectInput
            disabled={disabled}
            onChange={(value) => update("unit", value)}
            value={sla.unit}
          >
            <option value="MINUTES">Minutos</option>
            <option value="HOURS">Horas</option>
            <option value="BUSINESS_DAYS">Días hábiles</option>
            <option value="CALENDAR_DAYS">Días calendario</option>
          </SelectInput>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Checkbox
          checked={sla.reminderEnabled}
          disabled={disabled}
          label="Activar recordatorio"
          onChange={(checked) => update("reminderEnabled", checked)}
        />
        <Checkbox
          checked={sla.escalationEnabled}
          disabled={disabled}
          label="Activar escalamiento"
          onChange={(checked) => update("escalationEnabled", checked)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Umbral de recordatorio">
          <TextInput
            disabled={disabled || !sla.reminderEnabled}
            onChange={(value) =>
              update("reminderThreshold", Number(value) || null)
            }
            type="number"
            value={sla.reminderThreshold}
          />
        </Field>
        <Field label="Umbral de escalamiento">
          <TextInput
            disabled={disabled || !sla.escalationEnabled}
            onChange={(value) =>
              update("escalationThreshold", Number(value) || null)
            }
            type="number"
            value={sla.escalationThreshold}
          />
        </Field>
      </div>
    </div>
  );
}

function ConditionRules({
  configuration,
  disabled,
  onChange,
}: {
  configuration: ConditionNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Operador lógico">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("logicalOperator", value)}
            value={configuration.logicalOperator}
          >
            <option value="AND">Todas las reglas (AND)</option>
            <option value="OR">Cualquier regla (OR)</option>
          </SelectInput>
        </Field>
        <Field label="Ruta alternativa">
          <TextInput
            disabled={disabled}
            onChange={(value) => onChange("defaultRouteLabel", value || null)}
            value={configuration.defaultRouteLabel}
          />
        </Field>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Reglas ({configuration.rules.length})
          </p>
          <button
            className="nibol-btn-secondary px-3 py-2 text-xs"
            disabled={disabled}
            onClick={() =>
              onChange("rules", [
                ...configuration.rules,
                {
                  field: "riskLevel",
                  operator: "EQUALS",
                  resultLabel: null,
                  value: "",
                },
              ])
            }
            type="button"
          >
            Añadir regla
          </button>
        </div>
        {configuration.rules.length === 0 ? (
          <p className="border border-dashed border-[var(--border-strong)] px-4 py-4 text-sm text-[var(--muted)]">
            Defina al menos una regla para que las rutas puedan documentar su
            resultado.
          </p>
        ) : null}
        {configuration.rules.map((rule, index) => (
          <div
            className="grid gap-3 border border-[var(--border)] bg-[var(--surface-soft)] p-3"
            key={`${rule.field}-${index}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                Regla {index + 1}
              </span>
              <button
                aria-label={`Eliminar regla ${index + 1}`}
                className="p-1 text-[var(--muted)] hover:bg-white hover:text-[var(--accent)]"
                disabled={disabled}
                onClick={() =>
                  onChange(
                    "rules",
                    configuration.rules.filter(
                      (_, ruleIndex) => ruleIndex !== index,
                    ),
                  )
                }
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Campo">
                <SelectInput
                  disabled={disabled}
                  onChange={(value) => {
                    const rules = [...configuration.rules];
                    rules[index] = {
                      ...rules[index],
                      field: value as WorkflowConditionField,
                    };
                    onChange("rules", rules);
                  }}
                  value={rule.field}
                >
                  {CONDITION_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {CONDITION_FIELD_LABELS[field]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Operador">
                <SelectInput
                  disabled={disabled}
                  onChange={(value) => {
                    const nextOperator = value as WorkflowConditionOperator;
                    const rules = [...configuration.rules];
                    rules[index] = {
                      ...rules[index],
                      operator: nextOperator,
                      value: isValueFreeOperator(nextOperator)
                        ? null
                        : rules[index].value,
                    };
                    onChange("rules", rules);
                  }}
                  value={rule.operator}
                >
                  {CONDITION_OPERATORS.map((operator) => (
                    <option key={operator} value={operator}>
                      {CONDITION_OPERATOR_LABELS[operator]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field label="Valor">
              {rule.operator === "IN" || rule.operator === "NOT_IN" ? (
                <textarea
                  className="nibol-field min-h-20 py-2 text-sm"
                  disabled={disabled || isValueFreeOperator(rule.operator)}
                  onChange={(event) => {
                    const values = event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean);
                    const rules = [...configuration.rules];
                    rules[index] = { ...rules[index], value: values };
                    onChange("rules", rules);
                  }}
                  placeholder="Separe valores con comas"
                  value={Array.isArray(rule.value) ? rule.value.join(", ") : ""}
                />
              ) : (
                <TextInput
                  disabled={disabled || isValueFreeOperator(rule.operator)}
                  onChange={(value) => {
                    const rules = [...configuration.rules];
                    rules[index] = { ...rules[index], value: value || null };
                    onChange("rules", rules);
                  }}
                  value={
                    typeof rule.value === "string" ||
                    typeof rule.value === "number"
                      ? rule.value
                      : ""
                  }
                />
              )}
            </Field>
            <Field label="Etiqueta de resultado">
              <TextInput
                disabled={disabled}
                onChange={(value) => {
                  const rules = [...configuration.rules];
                  rules[index] = {
                    ...rules[index],
                    resultLabel: value || null,
                  };
                  onChange("rules", rules);
                }}
                placeholder="Ej. Riesgo alto"
                value={rule.resultLabel}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommonFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: WorkflowDesignerNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="General">
      <Field label="Nombre del nodo" required>
        <TextInput
          disabled={disabled}
          onChange={(value) => onChange("name", value)}
          value={configuration.name}
        />
      </Field>
      <Field label="Descripción">
        <textarea
          className="nibol-field min-h-20 py-2 text-sm"
          disabled={disabled}
          onChange={(event) =>
            onChange("description", event.target.value || null)
          }
          value={configuration.description ?? ""}
        />
      </Field>
    </Section>
  );
}

function StartFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: StartNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="Activación">
      <Field label="Trigger process" required>
        <TextInput
          disabled
          value={configuration.triggerProcess}
          onChange={() => undefined}
        />
      </Field>
      <Field label="Estado inicial">
        <TextInput
          disabled={disabled}
          onChange={(value) => onChange("initialWorkflowState", value)}
          value={configuration.initialWorkflowState}
        />
      </Field>
      <Field label="Nota de activación">
        <TextInput
          disabled={disabled}
          onChange={(value) => onChange("activationNote", value || null)}
          value={configuration.activationNote}
        />
      </Field>
    </Section>
  );
}

function StageFields({
  configuration,
  disabled,
  onChange,
  options,
}: {
  configuration: StageNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  return (
    <>
      <Section title="Responsable">
        <AssignmentFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      </Section>
      <Section title="Requisitos y resultado">
        <Checkbox
          checked={configuration.requiredComment}
          disabled={disabled}
          label="Comentario obligatorio"
          onChange={(value) => onChange("requiredComment", value)}
        />
        <Checkbox
          checked={configuration.requiredEvidence}
          disabled={disabled}
          label="Evidencia obligatoria"
          onChange={(value) => onChange("requiredEvidence", value)}
        />
        <Field label="Estado resultante">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("resultingState", value || null)}
            value={configuration.resultingState}
          >
            <option value="">Sin definir</option>
            {options?.catalogs.observationStatuses.map((status) => (
              <option key={status.key} value={status.key}>
                {status.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="SLA opcional">
          <SlaFields
            configuration={configuration.sla}
            disabled={disabled}
            onChange={(value) => onChange("sla", value)}
          />
        </Field>
      </Section>
      <Section title="Acciones permitidas">
        <ActionChecks
          actions={configuration.allowedActions}
          disabled={disabled}
          labels={{
            COMPLETE: "Completar",
            OBSERVE: "Observar",
            REQUEST_CORRECTION: "Solicitar corrección",
            REASSIGN: "Reasignar",
          }}
          onChange={(value) => onChange("allowedActions", value)}
        />
      </Section>
    </>
  );
}

function ApprovalFields({
  configuration,
  disabled,
  onChange,
  options,
}: {
  configuration: ApprovalNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  return (
    <>
      <Section title="Responsable">
        <AssignmentFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      </Section>
      <Section title="Requisitos">
        <Checkbox
          checked={configuration.commentRequired}
          disabled={disabled}
          label="Comentario obligatorio"
          onChange={(value) => onChange("commentRequired", value)}
        />
        <Checkbox
          checked={configuration.evidenceRequired}
          disabled={disabled}
          label="Evidencia obligatoria"
          onChange={(value) => onChange("evidenceRequired", value)}
        />
        <div className="grid gap-2">
          <Checkbox
            checked={false}
            disabled
            label="Firma electrónica (mecanismo pendiente)"
            onChange={() => undefined}
          />
          <p className="text-xs leading-5 text-[var(--muted)]">
            La firma electrónica se habilitará cuando exista un mecanismo
            soportado.
          </p>
        </div>
      </Section>
      <Section title="Acciones permitidas">
        <ActionChecks
          actions={configuration.allowedActions}
          disabled={disabled}
          labels={{
            APPROVE: "Aprobar",
            REJECT: "Rechazar",
            OBSERVE: "Observar",
            REQUEST_CORRECTION: "Solicitar corrección",
            REASSIGN: "Reasignar",
          }}
          onChange={(value) => onChange("allowedActions", value)}
        />
      </Section>
      <Section title="Resultado">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado después de aprobar">
            <SelectInput
              disabled={disabled}
              onChange={(value) =>
                onChange("stateAfterApproval", value || null)
              }
              value={configuration.stateAfterApproval}
            >
              <option value="">Sin definir</option>
              {options?.catalogs.observationStatuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Estado después de rechazar">
            <SelectInput
              disabled={disabled}
              onChange={(value) =>
                onChange("stateAfterRejection", value || null)
              }
              value={configuration.stateAfterRejection}
            >
              <option value="">Sin definir</option>
              {options?.catalogs.observationStatuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etiqueta de ruta aprobada">
            <TextInput
              disabled={disabled}
              onChange={(value) =>
                onChange("routeLabelOnApproval", value || null)
              }
              value={configuration.routeLabelOnApproval}
            />
          </Field>
          <Field label="Etiqueta de ruta rechazada">
            <TextInput
              disabled={disabled}
              onChange={(value) =>
                onChange("routeLabelOnRejection", value || null)
              }
              value={configuration.routeLabelOnRejection}
            />
          </Field>
        </div>
      </Section>
      <Section title="SLA">
        <SlaFields
          configuration={configuration.sla}
          disabled={disabled}
          onChange={(value) => onChange("sla", value)}
        />
      </Section>
    </>
  );
}

function RejectionFields({
  configuration,
  disabled,
  nodes,
  onChange,
}: {
  configuration: RejectionNodeConfiguration;
  disabled: boolean;
  nodes: WorkflowDesignerNode[];
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="Comportamiento">
      <Field label="Comportamiento de rechazo">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("behavior", value)}
          value={configuration.behavior}
        >
          <option value="FINAL">Finalizar rechazado</option>
          <option value="RETURN_TO_STAGE">Retornar a una etapa</option>
          <option value="REQUEST_CORRECTION">Solicitar corrección</option>
          <option value="KEEP_STATE">Mantener estado actual</option>
        </SelectInput>
      </Field>
      {configuration.behavior === "RETURN_TO_STAGE" ? (
        <Field label="Etapa de retorno" required>
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("returnTargetNodeKey", value || null)}
            value={configuration.returnTargetNodeKey}
          >
            <option value="">Seleccione un nodo</option>
            {nodes
              .filter(
                (node) => node.type !== "REJECTION" && node.type !== "END",
              )
              .map((node) => (
                <option key={node.nodeKey} value={node.nodeKey}>
                  {node.name}
                </option>
              ))}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Resultado final">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("finalResult", value)}
          value={configuration.finalResult}
        >
          <option value="REJECTED">Finalizado rechazado</option>
          <option value="CORRECTION_REQUESTED">Corrección solicitada</option>
          <option value="CURRENT_STATE">Estado actual</option>
        </SelectInput>
      </Field>
      <Field label="Estado resultante">
        <TextInput
          disabled={disabled}
          onChange={(value) => onChange("resultingState", value || null)}
          value={configuration.resultingState}
        />
      </Field>
      <Checkbox
        checked={configuration.preserveOriginalDeadline}
        disabled={disabled}
        label="Preservar la fecha límite original"
        onChange={(value) => onChange("preserveOriginalDeadline", value)}
      />
      <Checkbox
        checked={configuration.requireComment}
        disabled={disabled}
        label="Comentario obligatorio"
        onChange={(value) => onChange("requireComment", value)}
      />
      <Checkbox
        checked={configuration.notifyRequester}
        disabled={disabled}
        label="Notificar al solicitante"
        onChange={(value) => onChange("notifyRequester", value)}
      />
    </Section>
  );
}

function ConditionFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: ConditionNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="Reglas controladas">
      <ConditionRules
        configuration={configuration}
        disabled={disabled}
        onChange={onChange}
      />
    </Section>
  );
}

function SlaNodeFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: SlaNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="Parámetros SLA">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duración">
          <TextInput
            disabled={disabled}
            onChange={(value) => onChange("duration", Number(value) || 0)}
            type="number"
            value={configuration.duration}
          />
        </Field>
        <Field label="Unidad">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("unit", value)}
            value={configuration.unit}
          >
            <option value="MINUTES">Minutos</option>
            <option value="HOURS">Horas</option>
            <option value="BUSINESS_DAYS">Días hábiles</option>
            <option value="CALENDAR_DAYS">Días calendario</option>
          </SelectInput>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Umbral de recordatorio">
          <TextInput
            disabled={disabled}
            onChange={(value) =>
              onChange("reminderThreshold", Number(value) || null)
            }
            type="number"
            value={configuration.reminderThreshold}
          />
        </Field>
        <Field label="Umbral de escalamiento">
          <TextInput
            disabled={disabled}
            onChange={(value) =>
              onChange("escalationThreshold", Number(value) || null)
            }
            type="number"
            value={configuration.escalationThreshold}
          />
        </Field>
      </div>
      <Field label="Acción al vencer">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("actionOnBreach", value)}
          value={configuration.actionOnBreach}
        >
          <option value="NOTIFY">Notificar</option>
          <option value="ESCALATE">Escalar</option>
          <option value="REASSIGN">Reasignar</option>
          <option value="MARK_OVERDUE">Marcar vencido</option>
          <option value="ALTERNATE_ROUTE">Seguir ruta alternativa</option>
        </SelectInput>
      </Field>
    </Section>
  );
}

function EscalationFields({
  configuration,
  disabled,
  onChange,
  options,
}: {
  configuration: EscalationNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  return (
    <Section title="Destino de escalamiento">
      <Field label="Estrategia">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("escalationStrategy", value)}
          value={configuration.escalationStrategy}
        >
          <option value="SUPERVISOR">Supervisor</option>
          <option value="AREA_MANAGER">Gerente del área</option>
          <option value="ROLE">Rol</option>
          <option value="FIXED_USER">Usuario fijo</option>
        </SelectInput>
      </Field>
      {configuration.escalationStrategy === "ROLE" ? (
        <Field label="Rol destino">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("targetRoleId", value || null)}
            value={configuration.targetRoleId}
          >
            <option value="">Seleccione un rol</option>
            {options?.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      {configuration.escalationStrategy === "FIXED_USER" ? (
        <Field label="Usuario destino">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("targetUserId", value || null)}
            value={configuration.targetUserId}
          >
            <option value="">Seleccione un usuario</option>
            {options?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      {configuration.escalationStrategy === "AREA_MANAGER" ? (
        <Field label="Área">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("areaId", value || null)}
            value={configuration.areaId}
          >
            <option value="">Seleccione un área</option>
            {options?.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Usuario de respaldo">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("fallbackUserId", value || null)}
          value={configuration.fallbackUserId}
        >
          <option value="">Sin usuario de respaldo</option>
          {options?.users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Checkbox
        checked={configuration.reassignCurrentTask}
        disabled={disabled}
        label="Reasignar la tarea actual"
        onChange={(value) => onChange("reassignCurrentTask", value)}
      />
      <Checkbox
        checked={configuration.notifyPreviousAssignee}
        disabled={disabled}
        label="Notificar al responsable anterior"
        onChange={(value) => onChange("notifyPreviousAssignee", value)}
      />
      <Checkbox
        checked={configuration.notifyNewAssignee}
        disabled={disabled}
        label="Notificar al nuevo responsable"
        onChange={(value) => onChange("notifyNewAssignee", value)}
      />
    </Section>
  );
}

function NotificationFields({
  configuration,
  disabled,
  onChange,
  options,
}: {
  configuration: NotificationNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  return (
    <Section title="Comunicación">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Canal">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("channel", value)}
            value={configuration.channel}
          >
            <option value="INTERNAL">Interno</option>
            <option value="EMAIL">Email</option>
          </SelectInput>
        </Field>
        <Field label="Plantilla">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("template", value)}
            value={configuration.template}
          >
            <option value="">Seleccione una plantilla</option>
            {options?.notificationTemplates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field label="Estrategia de destinatario">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("recipientStrategy", value)}
          value={configuration.recipientStrategy}
        >
          <option value="CURRENT_ASSIGNEE">Responsable actual</option>
          <option value="REQUESTER">Solicitante</option>
          <option value="PREVIOUS_APPROVER">Aprobador anterior</option>
          <option value="FIXED_USER">Usuario fijo</option>
          <option value="ROLE">Rol</option>
          <option value="AREA_MANAGER">Gerente del área</option>
          <option value="OBSERVATION_RESPONSIBLE">
            Responsable de la observación
          </option>
        </SelectInput>
      </Field>
      {configuration.recipientStrategy === "FIXED_USER" ? (
        <Field label="Usuario destinatario">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("recipientUserId", value || null)}
            value={configuration.recipientUserId}
          >
            <option value="">Seleccione un usuario</option>
            {options?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      {configuration.recipientStrategy === "ROLE" ? (
        <Field label="Rol destinatario">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("recipientRoleId", value || null)}
            value={configuration.recipientRoleId}
          >
            <option value="">Seleccione un rol</option>
            {options?.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      {configuration.recipientStrategy === "AREA_MANAGER" ? (
        <Field label="Área destinataria">
          <SelectInput
            disabled={disabled}
            onChange={(value) => onChange("recipientAreaId", value || null)}
            value={configuration.recipientAreaId}
          >
            <option value="">Seleccione un área</option>
            {options?.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Asunto alternativo">
        <TextInput
          disabled={disabled || configuration.channel !== "EMAIL"}
          onChange={(value) => onChange("subjectOverride", value || null)}
          value={configuration.subjectOverride}
        />
      </Field>
      <Checkbox
        checked={configuration.includeWorkflowContext}
        disabled={disabled}
        label="Incluir contexto del workflow"
        onChange={(value) => onChange("includeWorkflowContext", value)}
      />
      <Checkbox
        checked={configuration.includeRelatedRecordLink}
        disabled={disabled}
        label="Incluir enlace al registro relacionado"
        onChange={(value) => onChange("includeRelatedRecordLink", value)}
      />
    </Section>
  );
}

function EndFields({
  configuration,
  disabled,
  onChange,
}: {
  configuration: EndNodeConfiguration;
  disabled: boolean;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <Section title="Resultado final">
      <Field label="Resultado">
        <SelectInput
          disabled={disabled}
          onChange={(value) => onChange("finalResult", value)}
          value={configuration.finalResult}
        >
          <option value="APPROVED">Aprobado</option>
          <option value="REJECTED">Rechazado</option>
          <option value="CLOSED">Cerrado</option>
          <option value="RETURNED">Devuelto</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="EXPIRED">Vencido</option>
        </SelectInput>
      </Field>
      <Field label="Estado final del workflow">
        <TextInput
          disabled={disabled}
          onChange={(value) => onChange("finalWorkflowStatus", value)}
          value={configuration.finalWorkflowStatus}
        />
      </Field>
      <Field label="Estado del registro relacionado">
        <TextInput
          disabled={disabled}
          onChange={(value) =>
            onChange("relatedRecordTargetState", value || null)
          }
          value={configuration.relatedRecordTargetState}
        />
      </Field>
      <Field label="Mensaje de finalización">
        <textarea
          className="nibol-field min-h-20 py-2 text-sm"
          disabled={disabled}
          onChange={(event) =>
            onChange("completionMessage", event.target.value || null)
          }
          value={configuration.completionMessage ?? ""}
        />
      </Field>
      <Checkbox
        checked={configuration.notifyParticipants}
        disabled={disabled}
        label="Notificar a participantes"
        onChange={(value) => onChange("notifyParticipants", value)}
      />
    </Section>
  );
}

function ConfigurationBody({
  configuration,
  disabled,
  nodes,
  onChange,
  options,
}: {
  configuration: WorkflowDesignerNodeConfiguration;
  disabled: boolean;
  nodes: WorkflowDesignerNode[];
  onChange: (key: string, value: unknown) => void;
  options: WorkflowDesignerOptions | undefined;
}) {
  return (
    <>
      <CommonFields
        configuration={configuration}
        disabled={disabled}
        onChange={onChange}
      />
      {configuration.nodeType === "START" ? (
        <StartFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {configuration.nodeType === "STAGE" ? (
        <StageFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      ) : null}
      {configuration.nodeType === "APPROVAL" ? (
        <ApprovalFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      ) : null}
      {configuration.nodeType === "REJECTION" ? (
        <RejectionFields
          configuration={configuration}
          disabled={disabled}
          nodes={nodes}
          onChange={onChange}
        />
      ) : null}
      {configuration.nodeType === "CONDITION" ? (
        <ConditionFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {configuration.nodeType === "SLA" ? (
        <SlaNodeFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
      {configuration.nodeType === "ESCALATION" ? (
        <EscalationFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      ) : null}
      {configuration.nodeType === "NOTIFICATION" ? (
        <NotificationFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
          options={options}
        />
      ) : null}
      {configuration.nodeType === "END" ? (
        <EndFields
          configuration={configuration}
          disabled={disabled}
          onChange={onChange}
        />
      ) : null}
    </>
  );
}

export function WorkflowNodeConfigPanel({
  node,
  nodes,
  onApply,
  onClose,
  onDirtyChange,
  options,
  processType,
  readOnly,
}: NodeConfigPanelProps) {
  const [draft, setDraft] = useState<WorkflowDesignerNodeConfiguration | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate the local form when selection changes. */
  useEffect(() => {
    const next = node ? cloneConfiguration(node.configurationJson) : null;
    setDraft(next);
    setDirty(false);
    onDirtyChange(false);
  }, [node, onDirtyChange]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const errors = useMemo(
    () => (draft ? validateConfiguration(draft, processType) : []),
    [draft, processType],
  );

  if (!node || !draft) {
    return (
      <aside className="nibol-panel flex min-h-[24rem] flex-col justify-between p-5 xl:min-h-0">
        <div className="grid gap-4">
          <div className="flex items-center gap-3 text-[var(--primary)]">
            <SlidersHorizontal className="h-5 w-5" />
            <p className="text-xs font-bold tracking-[0.18em] uppercase">
              Configuración
            </p>
          </div>
          <p className="max-w-xs text-sm leading-7 text-[var(--foreground-soft)]">
            Seleccione un nodo en el lienzo para revisar su configuración y sus
            rutas.
          </p>
        </div>
        <div className="border border-dashed border-[var(--border-strong)] px-4 py-4 text-xs leading-5 text-[var(--muted)]">
          La configuración se guarda junto con el grafo completo del borrador.
        </div>
      </aside>
    );
  }

  const setValue = (key: string, value: unknown) => {
    setDraft((current) =>
      current
        ? ({ ...current, [key]: value } as WorkflowDesignerNodeConfiguration)
        : current,
    );
    setDirty(true);
    onDirtyChange(true);
  };

  const revert = () => {
    setDraft(cloneConfiguration(node.configurationJson));
    setDirty(false);
    onDirtyChange(false);
  };

  return (
    <aside className="nibol-panel flex min-h-[24rem] min-w-0 flex-col overflow-hidden xl:max-h-[calc(100vh-13rem)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <p className="nibol-eyebrow">{NODE_TYPE_LABELS[draft.nodeType]}</p>
          <h2 className="font-display mt-1 truncate text-2xl font-bold tracking-[-0.03em] uppercase">
            {draft.name}
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{node.nodeKey}</p>
        </div>
        <button
          aria-label="Cerrar configuración"
          className="p-2 text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {readOnly ? (
          <div className="mb-5 flex items-start gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 text-xs leading-5 text-[var(--foreground-soft)]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            <span>
              Esta versión es de solo lectura. Puede inspeccionar la
              configuración, pero no modificarla.
            </span>
          </div>
        ) : null}
        {errors.length > 0 ? (
          <div className="mb-5 grid gap-2 border border-[color:color-mix(in_srgb,var(--accent)_20%,white)] bg-[var(--accent-soft)] px-3 py-3 text-xs leading-5 text-[var(--foreground)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--accent)]">
              <CircleAlert className="h-4 w-4" /> {errors.length} observación
              {errors.length === 1 ? "" : "es"}
            </div>
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <ConfigurationBody
          configuration={draft}
          disabled={readOnly}
          nodes={nodes}
          onChange={setValue}
          options={options}
        />
        <details className="mt-6 border-t border-[var(--border)] pt-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            <ChevronDown className="h-4 w-4" /> Detalles técnicos
          </summary>
          <div className="mt-3 grid gap-3 text-xs text-[var(--muted)]">
            <p className="flex items-center gap-2">
              <Braces className="h-4 w-4" /> ID persistido: {node.id}
            </p>
            <p>Node key: {node.nodeKey}</p>
            <p>Tipo: {node.type}</p>
            <p>Esquema: v{draft.schemaVersion}</p>
          </div>
        </details>
      </div>

      {!readOnly ? (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="nibol-btn-secondary justify-center px-3 py-2.5 text-xs"
            disabled={!dirty}
            onClick={revert}
            type="button"
          >
            <RotateCcw className="h-4 w-4" /> Revertir
          </button>
          <button
            className="nibol-btn-primary justify-center px-3 py-2.5 text-xs"
            disabled={!dirty || errors.length > 0}
            onClick={() => {
              onApply(node.id, draft);
              setDirty(false);
              onDirtyChange(false);
            }}
            type="button"
          >
            <Check className="h-4 w-4" /> Aplicar cambios
          </button>
        </div>
      ) : null}
    </aside>
  );
}
