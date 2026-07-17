export interface ServerMetrics {
  cpuUsage: number;                  // Porcentaje de uso de CPU
  memoryUsage: number;               // Porcentaje de uso de memoria
  activeTriageSessions: number;      // Casos activos simultáneos
  maxCapacity: number;               // Capacidad máxima soportada
  currentLoadPercent: number;        // Porcentaje real de uso del servidor
  averageAiResponseTimeSeconds: number; // Tiempo promedio de respuesta de la IA en segundos
}

export interface SeverityDetail {
  count: number;
  percent: number;
}

export interface SeverityDistribution {
  critical: SeverityDetail;          // Rojo (Crítico)
  urgent: SeverityDetail;            // Naranja (Urgente)
  minor: SeverityDetail;             // Amarillo / Verde (Menor)
}

export interface ConversionMetrics {
  totalSessionsStarted: number;       // Sesiones totales iniciadas
  completedTriage: number;           // Sesiones completadas exitosamente
  abandonedTriage: number;           // Sesiones abandonadas a mitad de camino
  conversionRatePercent: number;     // Tasa de resolución (conversión)
  averageMessagesPerSession: number; // Promedio de mensajes por sesión
}

export interface ChatActivityDay {
  dayLabel: string;
  count: number;
}

export interface DashboardMetrics {
  server: ServerMetrics;
  severity: SeverityDistribution;
  conversion: ConversionMetrics;
  chatActivity: ChatActivityDay[];
  timestamp: string;
}

// Capacidad diaria de referencia para escalar las barras de actividad sin llegar al 100% de inmediato
export const BASE_DAILY_CAPACITY_LIMIT = 100;

// Capacidad máxima de sesiones simultáneas
export const MAX_SERVER_CONCURRENT_SESSIONS = 200;

/**
 * Genera un set de datos de métricas altamente realistas y ponderadas.
 * Se simula un escenario de "tráfico medio" con 45 usuarios activos y 120 mensajes en la última hora.
 */
export const getSimulatedMetrics = (
  activeSessions: number = 45,
  messagesInLastHour: number = 120
): DashboardMetrics => {
  // 1. Cálculos de Servidor / Carga actual ponderada
  const currentLoadPercent = Math.min(
    Math.round((activeSessions / MAX_SERVER_CONCURRENT_SESSIONS) * 1000) / 10,
    100
  );
  
  // CPU fluctúa alrededor de la carga + base de 12%
  const cpuUsage = Math.min(
    Math.round((12 + currentLoadPercent * 0.8 + (Math.random() * 4 - 2)) * 10) / 10,
    100
  );
  
  // Memoria fluctúa alrededor de base 38% + carga * 0.4
  const memoryUsage = Math.min(
    Math.round((38 + currentLoadPercent * 0.4 + (Math.random() * 2 - 1)) * 10) / 10,
    100
  );

  // Tiempo de respuesta de IA ponderado: base de 1.1s, aumenta levemente con la carga del servidor
  const averageAiResponseTimeSeconds = Math.round((1.15 + (currentLoadPercent * 0.02) + (Math.random() * 0.3 - 0.15)) * 100) / 100;

  // 2. Distribución de severidad basada en el protocolo clínico de triaje
  // Críticos: ~6.7%, Urgentes: ~24.4%, Menores: ~68.9%
  const criticalCount = Math.round(activeSessions * 0.067); // Para 45, es ~3
  const urgentCount = Math.round(activeSessions * 0.244);   // Para 45, es ~11
  const minorCount = activeSessions - (criticalCount + urgentCount); // Para 45, es ~31

  const severity: SeverityDistribution = {
    critical: {
      count: criticalCount,
      percent: Math.round((criticalCount / activeSessions) * 1000) / 10
    },
    urgent: {
      count: urgentCount,
      percent: Math.round((urgentCount / activeSessions) * 1000) / 10
    },
    minor: {
      count: minorCount,
      percent: Math.round((minorCount / activeSessions) * 1000) / 10
    }
  };

  // 3. Tasa de conversión / resolución
  // Asumiendo que 120 mensajes corresponden a múltiples sesiones en la última hora.
  // Si cada sesión completada dura unos 5.4 mensajes y las abandonadas duran unos 2.2 mensajes
  const completedSessions = Math.round(messagesInLastHour * 0.8 / 5.4); // ~18
  const abandonedSessions = Math.round(messagesInLastHour * 0.2 / 2.2); // ~11
  const totalSessionsStarted = completedSessions + abandonedSessions;   // ~29

  const conversionRatePercent = Math.round((completedSessions / totalSessionsStarted) * 1000) / 10;
  const averageMessagesPerSession = Math.round((messagesInLastHour / totalSessionsStarted) * 10) / 10;

  const conversion: ConversionMetrics = {
    totalSessionsStarted,
    completedTriage: completedSessions,
    abandonedTriage: abandonedSessions,
    conversionRatePercent,
    averageMessagesPerSession
  };

  // 4. Actividad histórica de chat de los últimos 7 días
  // Estos valores simulan el tráfico diario de mensajes. Note que ninguno llena al 100% de manera estática
  // si el límite base es de 100 mensajes, pero reflejan un patrón realista de uso.
  const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  const currentDayIdx = new Date().getDay();
  
  const chatActivity: ChatActivityDay[] = Array.from({ length: 7 }).map((_, idx) => {
    // Generar etiquetas de días anteriores en orden cronológico
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dayLabel = days[d.getDay()];

    // Tráfico simulado diario (mensajes totales por día)
    // Fin de semana menos tráfico, mitad de semana pico de tráfico
    let baseVal = 40;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend) {
      baseVal = 25;
    } else if (d.getDay() === 3 || d.getDay() === 4) { // Miércoles, Jueves
      baseVal = 85;
    } else {
      baseVal = 60;
    }
    
    // Variación aleatoria para realismo
    const noise = Math.floor(Math.random() * 15) - 7;
    const count = Math.max(baseVal + noise, 0);

    return {
      dayLabel,
      count
    };
  });

  // Reemplazar el último día con los mensajes reales de la última hora (para simulación dinámica)
  if (chatActivity.length > 0) {
    chatActivity[chatActivity.length - 1].count = Math.max(
      chatActivity[chatActivity.length - 1].count, 
      messagesInLastHour
    );
  }

  return {
    server: {
      cpuUsage,
      memoryUsage,
      activeTriageSessions: activeSessions,
      maxCapacity: MAX_SERVER_CONCURRENT_SESSIONS,
      currentLoadPercent,
      averageAiResponseTimeSeconds
    },
    severity,
    conversion,
    chatActivity,
    timestamp: new Date().toISOString()
  };
};

/**
 * Devuelve un string JSON estático que representa el estado del panel en un momento de tráfico medio.
 * Cumple directamente con el Requisito 3 (Formato de salida de datos en JSON realista).
 */
export const getStaticMetricsJSON = (): string => {
  const staticData: DashboardMetrics = {
    server: {
      cpuUsage: 28.3,
      memoryUsage: 47.1,
      activeTriageSessions: 45,
      maxCapacity: 200,
      currentLoadPercent: 22.5,
      averageAiResponseTimeSeconds: 1.55
    },
    severity: {
      critical: {
        count: 3,
        percent: 6.7
      },
      urgent: {
        count: 11,
        percent: 24.4
      },
      minor: {
        count: 31,
        percent: 68.9
      }
    },
    conversion: {
      totalSessionsStarted: 29,
      completedTriage: 23,
      abandonedTriage: 6,
      conversionRatePercent: 79.3,
      averageMessagesPerSession: 5.4
    },
    chatActivity: [
      { dayLabel: "Sab", count: 28 },
      { dayLabel: "Dom", count: 18 },
      { dayLabel: "Lun", count: 62 },
      { dayLabel: "Mar", count: 88 },
      { dayLabel: "Mie", count: 112 },
      { dayLabel: "Jue", count: 95 },
      { dayLabel: "Vie", count: 120 } // Hoy, tráfico medio
    ],
    timestamp: "2026-07-17T16:19:00.000Z"
  };
  return JSON.stringify(staticData, null, 2);
};
