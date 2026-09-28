import { Model } from '@nozbe/watermelondb';
import { text, field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Relation } from '@nozbe/watermelondb';
import type { Client } from './Client.model';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';

export class Appointment extends Model {
  static table = 'appointments';
  
  static associations = {
    clients: { type: 'belongs_to', key: 'client_id' },
  } as const;

  @text('foundry_id') foundryId!: string;
  @text('client_id') clientId!: string;
  @text('client_name') clientName!: string;
  @text('staff_id') staffId!: string;
  @text('staff_name') staffName!: string;
  @text('type_id') typeId?: string;
  @text('type_name') typeName!: string;
  @text('location_id') locationId!: string;
  @date('starts_at') startsAt!: Date;
  @date('ends_at') endsAt!: Date;
  @text('status') status!: AppointmentStatus;
  @text('notes') notes?: string;
  @text('intake_form_type') intakeFormType?: string;
  @date('reminder_sent_at') reminderSentAt?: Date;
  @date('synced_at') syncedAt!: Date;

  @relation('clients', 'client_id') client!: Relation<Client>;

  // Computed properties
  get duration(): number {
    return this.endsAt.getTime() - this.startsAt.getTime();
  }

  get durationMinutes(): number {
    return Math.round(this.duration / (1000 * 60));
  }

  get isPast(): boolean {
    return this.endsAt < new Date();
  }

  get isToday(): boolean {
    const today = new Date();
    const appointmentDate = this.startsAt;
    return (
      today.getFullYear() === appointmentDate.getFullYear() &&
      today.getMonth() === appointmentDate.getMonth() &&
      today.getDate() === appointmentDate.getDate()
    );
  }

  get isUpcoming(): boolean {
    return this.startsAt > new Date();
  }

  get isActive(): boolean {
    const now = new Date();
    return this.startsAt <= now && this.endsAt >= now;
  }

  get timeSlot(): string {
    const start = this.startsAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const end = this.endsAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    return `${start}–${end}`;
  }

  canMarkArrived(): boolean {
    return (this.status === 'scheduled' || this.status === 'confirmed') && !this.isPast;
  }

  canStart(): boolean {
    return this.status === 'arrived';
  }

  canStartSession(): boolean {
    return this.status === 'in_progress';
  }

  /** @deprecated Use canMarkArrived() instead */
  canCheckIn(): boolean {
    return this.canMarkArrived();
  }
}