const STATUS_DEFINITIONS = {
  '-1': { label: 'No leída *', code: 'NL_NVL' },
  '0': { label: 'Leída', code: 'L' },
  '2': { label: 'Cerrada', code: 'C' },
  '3': { label: 'Aprobada', code: 'AP' },
  '4': { label: 'Rechazada', code: 'R' }
};

const INCIDENT_LIBRARY = [
  {
    key: 'OALGEDW',
    pdr: 'OALGEDW',
    title: 'Area de desarrollo',
    obs: '1- Se detecta fuera del área de desarrollo una cámara que no funciona, lo que representa un riesgo de seguridad para los colaboradores. 2- Se observa que el área de desarrollo tiene una fuga de agua, lo que puede causar daños a los equipos y representar un riesgo eléctrico. 3- Se encuentran cables sueltos en el área de desarrollo, lo que puede causar tropiezos y caídas para los colaboradores.',
    fts: ['IMG_0696.jpeg', '', '']
  },
  {
    key: 'OFICINA_ALG',
    pdr: 'OFICINA_ALG',
    title: 'Oficina ALG',
    obs: '1- Se detectan objetos en el piso del área de la oficina de Ronny, lo que representa un riesgo de caída para los colaboradores. 2- Se observa polvo acumulado en el área de la oficina de Ronny, lo que indica falta de limpieza y mantenimiento. 3- Se encuentra una planta con hojas secas y sin riego en el área de la oficina de Ronny, lo que afecta la estética y el ambiente laboral.',
    fts: ['IMG_0699.jpeg', '', '']
  },
  {
    key: 'OALGOR',
    pdr: 'OALGOR',
    title: 'Oficina de Ronny',
    obs: '1- Se detecta que por el tema de las lluvias hay una filtración de agua en el área de la oficina de Ronny, lo que puede causar daños a los equipos y representar un riesgo eléctrico. 2- Se observa que el área de la oficina de Ronny tiene una iluminación deficiente, lo que puede causar fatiga visual y afectar la productividad de los colaboradores. 3- Se encuentran cables sueltos en el área de la oficina de Ronny, lo que puede causar tropiezos y caídas para los colaboradores.',
    fts: ['IMG_0702.jpeg', '', '']
  },
  {
    key: 'OALGSJ',
    pdr: 'OALGSJ',
    title: 'Sala de juntas',
    obs: '1- Se detectan muchos papeles acumulados en la sala de juntas, lo que representa un riesgo de incendio. 2- Se observa que las sillas de la sala de juntas están en mal estado, lo que puede causar lesiones a los colaboradores. 3- Se encuentran objetos ajenos en el área de la sala de juntas.',
    fts: ['IMG_0700.jpeg', '', '']
  }
];

const DATE_SCENARIOS = [
  {
    date: '2026-07-20',
    slots: [
      { hour: '09:00:03', turno: 'T1', statuses: ['3', '2', '4', '4'] },
      { hour: '11:00:04', turno: 'T1', statuses: ['4', '0', '-1', '-1'] },
      { hour: '13:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '15:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '17:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '19:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] }
    ]
  },
  {
    date: '2026-07-21',
    slots: [
      { hour: '09:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '11:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '13:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '15:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '17:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '19:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] }
    ]
  },
  {
    date: '2026-07-22',
    slots: [
      { hour: '09:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '11:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '13:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '15:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '17:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '19:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] }
    ]
  },
  {
    date: '2026-07-23',
    slots: [
      { hour: '09:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '11:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '13:00:02', turno: 'T1', statuses: ['-1', '-1', '-1', '-1'] },
      { hour: '15:00:02', turno: 'T2', statuses: ['-1', '-1', '-1', '-1'] }
    ]
  }
];

const SHARED_CONTEXT = {
  usuario: 'Gerardo Lara',
  usuarioAtendio: 'Gerardo Lara',
  direccion: 'Calle Benito Juárez 6, San Lucas Tepetlacalco, 54055 Tlalnepantla de Baz, Méx., México',
  grupo: '',
  pdis: ''
};

function createAttendedDate(date, hour, offsetMinutes) {
  const [hours = '00', minutes = '00'] = String(hour || '00:00:00').split(':');
  const dateValue = new Date(`${date}T${hours}:${minutes}:00`);
  if (Number.isNaN(dateValue.getTime())) {
    return '';
  }

  dateValue.setMinutes(dateValue.getMinutes() + offsetMinutes);

  const yyyy = dateValue.getFullYear();
  const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
  const dd = String(dateValue.getDate()).padStart(2, '0');
  const hh = String(dateValue.getHours()).padStart(2, '0');
  const min = String(dateValue.getMinutes()).padStart(2, '0');
  const ss = String(dateValue.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function createIncident(template, scenario, slot, slotIndex, incidentIndex) {
  const status = STATUS_DEFINITIONS[slot.statuses[incidentIndex]] || STATUS_DEFINITIONS['-1'];
  const isUnread = slot.statuses[incidentIndex] === '-1';
  const sequence = slotIndex * INCIDENT_LIBRARY.length + incidentIndex + 1;
  const ideBase = Number(String(scenario.date).replaceAll('-', '').slice(2)) * 100 + sequence;
  const idiBase = isUnread ? 0 : 30000 + sequence + (slotIndex * 10);

  return {
    IDE: String(ideBase),
    IDI: idiBase,
    IDR: `${ideBase}|${slot.statuses[incidentIndex]}`,
    FECHA: scenario.date,
    HORA: slot.hour,
    STT: slot.statuses[incidentIndex],
    STT_DESC: status.label,
    NVL: 0,
    PDR: template.pdr,
    PDR_LABEL: template.title,
    USUARIO: SHARED_CONTEXT.usuario,
    USUARIO_ATENDIO: isUnread ? '' : SHARED_CONTEXT.usuarioAtendio,
    ID_USUARIO_ATENDIO: isUnread ? '' : '954',
    FECHA_ATENDIDO: isUnread ? '' : createAttendedDate(scenario.date, slot.hour, 45 + sequence),
    TURNO: slot.turno,
    OBS: template.obs,
    FTS: [...template.fts],
    DIRECCION: SHARED_CONTEXT.direccion,
    GRUPO: SHARED_CONTEXT.grupo,
    PDIS: SHARED_CONTEXT.pdis
  };
}

export function buildDashboardDemoData() {
  const incidencias = [];

  DATE_SCENARIOS.forEach((scenario) => {
    scenario.slots.forEach((slot, slotIndex) => {
      INCIDENT_LIBRARY.forEach((template, incidentIndex) => {
        incidencias.push(createIncident(template, scenario, slot, slotIndex, incidentIndex));
      });
    });
  });

  return incidencias;
}

