"use client";

import * as React from "react";
import { Calendar, MapPin, User, DollarSign } from "lucide-react";
import { Summary } from "@/src/lib/parsing/types";

interface EntityChipsProps {
  entities?: Summary["entities"];
}

export function EntityChips({ entities }: EntityChipsProps) {
  if (!entities || (!entities.dates?.length && !entities.names?.length && !entities.places?.length && !entities.amounts?.length)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
      {entities.dates?.map((date, index) => (
        <div
          key={`date-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[13px]"
        >
          <Calendar className="h-3 w-3" strokeWidth={1.5} />
          <span>{date}</span>
        </div>
      ))}
      {entities.names?.map((name, index) => (
        <div
          key={`name-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-[13px]"
        >
          <User className="h-3 w-3" strokeWidth={1.5} />
          <span>{name}</span>
        </div>
      ))}
      {entities.places?.map((place, index) => (
        <div
          key={`place-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-[13px]"
        >
          <MapPin className="h-3 w-3" strokeWidth={1.5} />
          <span>{place}</span>
        </div>
      ))}
      {entities.amounts?.map((amount, index) => (
        <div
          key={`amount-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-[13px]"
        >
          <DollarSign className="h-3 w-3" strokeWidth={1.5} />
          <span>{amount}</span>
        </div>
      ))}
    </div>
  );
}

