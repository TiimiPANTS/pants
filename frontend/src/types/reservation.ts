export const availableTimes = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
] as const;

export type ReservationTime = (typeof availableTimes)[number];

export type ReservationForm = {
  firstName: string;
  lastName: string;
  email: string;
  specialRequests: string;
};

export type CustomerDto = {
  firstname: string;
  lastname: string;
  email: string;
};

export type ReservationRequestDto = {
  customer: CustomerDto;
  datetime: string;
  startTime: string;
  endTime: string;
  partySize: number;
  details: string;
};