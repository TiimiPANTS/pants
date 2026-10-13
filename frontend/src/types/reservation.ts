export type ReservationTime = string;

type ReservationHours = {
  open: string;
  close: string;
};

function getReservationHours(day: number): ReservationHours | null {
  if (day === 0) {
    return null;  //sunday closed
  }
  
  if (day ===6) {
    return { open: "11:00", close: "17:00"}; // Saturday
  }

  return { open: "10:00", close: "17:00"}; //Monday - Friday
}

function generateTimeSlots(
  open: string,
  close: string
): ReservationTime[] {
  const slots: ReservationTime[] = [];

  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);

  let current = openHour * 60 + openMinute;
  const end = closeHour * 60 + closeMinute;

  while (current <= end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;

    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    );

    current += 30;
  }

  return slots;
}

export function getAvailableTimes(
  date: Date | undefined
): ReservationTime[] {
  if (!date) {
    return [];
  }

  const hours = getReservationHours(date.getDay());

  if (!hours) {
    return [];
  }

  return generateTimeSlots(hours.open, hours.close);
}


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