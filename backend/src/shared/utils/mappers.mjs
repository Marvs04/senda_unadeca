export function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    carnet: row.carnet ?? undefined,
    employeeNumber: row.employee_number ?? undefined,
    institutionalEmail: row.institutional_email ?? undefined,
    departmentId: row.department_id ?? undefined,
    isActive: row.is_active !== false,
  };
}

export function toDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    headId: row.head_id ?? undefined,
    costCenter: row.cost_center ?? '',
  };
}

export function toWorkLog(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    departmentId: row.department_id,
    date: row.date,
    hours: Number(row.hours),
    description: row.description,
    status: row.status,
    entrySource: row.entry_source ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export function toRate(row) {
  return {
    rate: row.rate,
    effectiveDate: row.effective_date,
  };
}
