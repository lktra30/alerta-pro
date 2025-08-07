"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PeriodoFiltroProps {
  periodo: string;
  onPeriodoChange: (periodo: string, range?: DateRange) => void;
  className?: string;
}

export function PeriodoFiltro({ periodo, onPeriodoChange, className }: PeriodoFiltroProps) {
  const [date, setDate] = React.useState<DateRange | undefined>()

  const handlePeriodoChange = (value: string) => {
    if (value === "custom") {
      // Abre o popover, mas não chama onPeriodoChange ainda
    } else {
      setDate(undefined) // Limpa o range de datas
      onPeriodoChange(value)
    }
  }

  React.useEffect(() => {
    if (date?.from && date?.to) {
      onPeriodoChange("custom", date)
    }
  }, [date])

  const getLabel = () => {
    switch (periodo) {
      case "all": return "Todos os períodos"
      case "hoje": return "Hoje"
      case "ontem": return "Ontem"
      case "ultimos7": return "Últimos 7 dias"
      case "ultimos30": return "Últimos 30 dias"
      case "esteMes": return "Este mês"
      case "mesPassado": return "Mês passado"
      case "custom":
        if (date?.from && date?.to) {
          return `${format(date.from, "dd/MM/yy", { locale: ptBR })} - ${format(date.to, "dd/MM/yy", { locale: ptBR })}`
        }
        return "Personalizado"
      default:
        return "Selecione o período"
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={periodo} onValueChange={handlePeriodoChange}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os períodos</SelectItem>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="ontem">Ontem</SelectItem>
          <SelectItem value="ultimos7">Últimos 7 dias</SelectItem>
          <SelectItem value="ultimos30">Últimos 30 dias</SelectItem>
          <SelectItem value="esteMes">Este mês</SelectItem>
          <SelectItem value="mesPassado">Mês passado</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 