export class DomainError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'DomainError';
  }
}

export class DuplicateReportError extends DomainError {
  constructor(public readonly existingReportId: string, public readonly distanceMeters: number) {
    super(
      `Ya existe un reporte similar registrado a ${Math.round(distanceMeters)} metros de esta ubicación.`,
      409
    );
    this.name = 'DuplicateReportError';
  }
}
