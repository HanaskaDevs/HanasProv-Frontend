// src/modules/legal/pages/PoliticaProteccionDatosPage.tsx
import { Link } from 'react-router-dom';
import PaginaLegal, { SeccionLegal, ListaLegal, DestacadoLegal } from '../components/PaginaLegal';
import { DATOS_EMPRESA, RESPONSABLES_TRATAMIENTO, RUTAS_LEGALES } from '../../../shared/config/datosEmpresa';

/**
 * Política de Protección de Datos Personales del Portal de Proveedores.
 *
 * ADAPTADA de la política corporativa general, NO copiada. Lo que se
 * cambió y por qué, para que quien la revise legalmente entienda el
 * criterio:
 *
 * SE QUITÓ
 *  - Las finalidades de candidato a colaborador, colaborador, cliente,
 *    prospecto de cliente, segmento educativo y visitante a oficinas. Este
 *    portal no trata esos datos. Declarar finalidades que no existen es
 *    peor que no declararlas: viola el principio de minimización y obliga
 *    a defender un tratamiento que no se hace.
 *  - Los apartados de clasificación y etiquetado de la información,
 *    información comercial sensible y defensa de la competencia. Eso es
 *    normativa INTERNA de la compañía, no información dirigida al titular;
 *    publicarla en un portal externo expone procedimientos internos sin
 *    darle nada al proveedor.
 *  - La tesis de "seguir navegando implica aceptación". Bajo la LOPDP el
 *    consentimiento debe ser libre, específico, informado e INEQUÍVOCO, y
 *    la navegación continuada no es inequívoca. Además, para este portal
 *    el consentimiento no es la base correcta (ver apartado 7).
 *
 * SE AGREGÓ
 *  - El inventario real de datos que trata el portal (apartado 6).
 *  - La base de licitud correcta: ejecución contractual y obligación legal
 *    (apartado 7).
 *  - Las DECISIONES AUTOMATIZADAS (apartado 8). El portal suspende accesos,
 *    aprueba/rechaza proveedores y calcula una nota de desempeño de forma
 *    automática, y todo eso produce efectos sobre el proveedor. La LOPDP
 *    da derecho a no quedar sujeto a decisiones solo automatizadas y a
 *    pedir intervención humana: omitirlo era el hueco más grande del
 *    documento original.
 *  - La transferencia internacional concreta al proveedor del asistente
 *    virtual (apartado 10).
 *  - Notificación de vulneraciones de seguridad (apartado 13).
 *  - El almacenamiento en el navegador descrito como es realmente: el
 *    portal no usa cookies ni analítica de terceros (apartado 14).
 */
export default function PoliticaProteccionDatosPage() {
  const { marca, direccion, ciudad, pais, emailProteccionDatos, email } = DATOS_EMPRESA;

  // Hoy el responsable es uno solo. Si mañana se suma la otra empresa del
  // grupo a RESPONSABLES_TRATAMIENTO, el documento pasa solo a redactar en
  // corresponsabilidad en vez de quedar diciendo "el responsable es" con
  // dos sociedades listadas debajo.
  const variosResponsables = RESPONSABLES_TRATAMIENTO.length > 1;

  return (
    <PaginaLegal
      titulo="Política de Protección de Datos Personales"
      bajada={`Aplicable al Portal de Proveedores de ${marca}. ${DATOS_EMPRESA.politicaVersion}.`}
    >
      <SeccionLegal numero={1} titulo="Generales">
        <p>
          {variosResponsables ? 'Las sociedades' : 'La sociedad'} que{variosResponsables ? 'operan' : ' opera'} el
          Portal de Proveedores de <strong>{marca}</strong>, legalmente constituida{variosResponsables ? 's' : ''} en el
          Ecuador e identificada{variosResponsables ? 's' : ''} en el apartado 4, es respetuosa de los derechos sobre los
          datos personales reconocidos en el artículo 66 numeral 19 y el artículo 92 de la
          Constitución de la República del Ecuador, en la Ley Orgánica de Protección de Datos
          Personales (en adelante «LOPDP») y demás normativa aplicable.
        </p>
        <p>
          Esta Política regula el tratamiento de datos personales que se realiza a través del{' '}
          <strong>Portal de Proveedores</strong>, la plataforma donde los proveedores de{' '}
          {marca} registran su información, cargan su documentación, gestionan su catálogo de
          productos y dan seguimiento a sus pedidos y calificaciones.
        </p>
        <p>
          Está disponible de forma pública y permanente, sin necesidad de tener una cuenta. Puede ser
          actualizada; cuando eso ocurra, la nueva versión se publicará en esta misma dirección.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={2} titulo="Definiciones">
        <ListaLegal>
          <li>
            <strong>Titular:</strong> la persona natural cuyos datos personales son objeto de
            tratamiento. En este portal, típicamente el representante legal o las personas de
            contacto que el proveedor registra, y los usuarios internos de {marca}.
          </li>
          <li>
            <strong>Dato personal:</strong> cualquier información que identifica o hace identificable
            a una persona natural, de manera directa o indirecta.
          </li>
          <li>
            <strong>Datos sensibles:</strong> los relativos a etnia, identidad de género, religión,
            ideología, filiación política, pasado judicial, condición migratoria, orientación sexual,
            salud, datos biométricos y genéticos.
          </li>
          <li>
            <strong>Tratamiento:</strong> cualquier operación sobre datos personales: recolección,
            registro, conservación, consulta, uso, modificación, comunicación, transferencia,
            supresión y cualquier otra.
          </li>
          <li>
            <strong>Responsable del tratamiento:</strong> quien decide sobre la finalidad del
            tratamiento. Para este portal, {variosResponsables ? 'las sociedades' : 'la sociedad'} identificada
            {variosResponsables ? 's' : ''} en el apartado 4.
          </li>
          <li>
            <strong>Encargado del tratamiento:</strong> quien trata datos personales por cuenta del
            responsable, por ejemplo un proveedor tecnológico.
          </li>
          <li>
            <strong>Delegado de Protección de Datos:</strong> la persona designada como vínculo entre
            los titulares, el responsable y la Autoridad de Protección de Datos Personales.
          </li>
          <li>
            <strong>Transferencia o comunicación:</strong> cualquier forma de revelación de datos
            personales a una persona distinta del titular, el responsable o el encargado.
          </li>
        </ListaLegal>
      </SeccionLegal>

      <SeccionLegal numero={3} titulo="Objeto y ámbito de aplicación">
        <p>
          Esta Política aplica a todos los datos personales tratados a través del Portal de
          Proveedores, cualquiera sea su soporte, y obliga al responsable del tratamiento, a los
          encargados que designe y a todo el personal involucrado en el tratamiento, sin importar su
          posición jerárquica.
        </p>
        <p>
          No aplica a otros tratamientos de {marca} ajenos a este portal, como los relativos a
          candidatos, colaboradores o clientes, que se rigen por la política corporativa
          correspondiente.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={4} titulo="Responsable y Delegado de Protección de Datos">
        <p>
          {variosResponsables ? (
            <>
              El Portal de Proveedores es una plataforma compartida por las siguientes sociedades del
              grupo {marca}, que actúan como <strong>corresponsables del tratamiento</strong>. Cada
              una responde por los datos de los proveedores con los que mantiene relación comercial:
            </>
          ) : (
            <>
              El <strong>responsable del tratamiento</strong> de los datos personales que se recogen
              a través del Portal de Proveedores del grupo {marca} es:
            </>
          )}
        </p>
        <div className="rounded-lg border border-brand-900/10 overflow-hidden">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="bg-brand-900/[0.03] text-left">
                <th className="px-4 py-2.5 font-medium text-brand-900">Razón social</th>
                <th className="px-4 py-2.5 font-medium text-brand-900">RUC</th>
              </tr>
            </thead>
            <tbody>
              {RESPONSABLES_TRATAMIENTO.map((entidad) => (
                <tr key={entidad.ruc} className="border-t border-brand-900/8">
                  <td className="px-4 py-2.5">{entidad.razonSocial}</td>
                  <td className="px-4 py-2.5 tabular-nums text-brand-900/70">{entidad.ruc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Dirección para notificaciones y atención de titulares:</strong> {direccion},{' '}
          {ciudad} — {pais}
          <br />
          <strong>Teléfono:</strong> {DATOS_EMPRESA.telefono}
          <br />
          <strong>Contacto del portal:</strong>{' '}
          <a className="text-brand-700 underline" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
        {variosResponsables && (
          <p className="text-[14px] text-brand-900/60">
            El canal de atención de derechos es único y compartido: no necesita averiguar con cuál de
            las sociedades tratar. Presente su solicitud una sola vez por el canal de abajo y se
            gestionará ante quien corresponda.
          </p>
        )}
        <DestacadoLegal>
          <p>
            <strong>Delegado de Protección de Datos Personales.</strong> Es el canal para ejercer sus
            derechos y para cualquier consulta, queja o reclamo sobre sus datos personales:
          </p>
          <p className="mt-2">
            <a className="text-brand-700 underline font-medium" href={`mailto:${emailProteccionDatos}`}>
              {emailProteccionDatos}
            </a>
          </p>
          <p className="mt-2 text-[14px]">
            También puede usar el{' '}
            <Link to={RUTAS_LEGALES.formularioDerechos} className="text-brand-700 underline">
              formulario de atención de derechos
            </Link>
            , que llega directamente a esta dirección.
          </p>
        </DestacadoLegal>
      </SeccionLegal>

      <SeccionLegal numero={5} titulo="Principios del tratamiento">
        <p>
          El tratamiento se rige por los principios de legalidad, lealtad, transparencia, finalidad,
          pertinencia, minimización, proporcionalidad, confidencialidad, calidad, exactitud,
          conservación, seguridad, y responsabilidad proactiva y demostrada, a favor del titular.
        </p>
        <p>
          En particular, el portal aplica el principio de <strong>minimización</strong>: solo se
          solicitan los datos necesarios para la relación comercial, y ningún usuario del portal
          accede a datos de proveedores o de empresas del grupo distintos de aquellos que le
          corresponden por su función. La información de cada empresa del grupo que opera en el
          portal está separada dentro de la plataforma.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={6} titulo="Qué datos tratamos y para qué">
        <p>
          El portal trata los siguientes datos personales, todos aportados por el propio proveedor o
          generados por el uso de la plataforma:
        </p>

        <p className="font-medium text-brand-900 pt-1">a) Identificación de la empresa proveedora</p>
        <ListaLegal>
          <li>RUC, razón social, nombre comercial y clase de contribuyente.</li>
          <li>
            Dirección, ciudad, teléfono, correo electrónico, página web y ubicación geográfica
            (coordenadas) del establecimiento.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: identificar y calificar al proveedor, y determinar qué documentación le
          corresponde presentar según su ciudad y su actividad.
        </p>

        <p className="font-medium text-brand-900 pt-2">b) Personas de contacto</p>
        <ListaLegal>
          <li>
            Nombre, correo electrónico y teléfono del representante legal y de los contactos de
            ventas, calidad y contabilidad.
          </li>
          <li>
            De los usuarios que acceden al portal: nombre completo, cargo, teléfono y correo
            electrónico.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: comunicaciones de la relación comercial, notificaciones del portal y gestión de
          las cuentas de acceso.
        </p>

        <p className="font-medium text-brand-900 pt-2">c) Documentación legal y habilitante</p>
        <ListaLegal>
          <li>
            Los documentos que el proveedor carga, con su fecha de caducidad cuando corresponde: RUC,
            certificado de afiliación al IESS, permisos de funcionamiento (ARCSA, Cuerpo de
            Bomberos), LUAE, notificación sanitaria, certificaciones de calidad, carta de garantía y
            autoevaluación, entre otros según su actividad.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: verificar que el proveedor cumple los requisitos legales y sanitarios exigidos, y
          mantener esa habilitación vigente en el tiempo. Estos documentos pueden contener datos
          personales de terceros (por ejemplo, el representante legal); el proveedor declara contar
          con la autorización para comunicarlos.
        </p>

        <p className="font-medium text-brand-900 pt-2">d) Actividad comercial en el portal</p>
        <ListaLegal>
          <li>Catálogo de productos, con precios, presentaciones y solicitudes de cambio de precio.</li>
          <li>Pedidos de compra, cantidades recibidas y porcentajes de entrega.</li>
          <li>
            Reclamos, con su tipo e impacto, los mensajes intercambiados y las imágenes adjuntas.
          </li>
          <li>Auditorías, calificaciones de recepción y calendario de horarios de entrega.</li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: ejecutar y dar seguimiento a la relación comercial, y evaluar el desempeño del
          proveedor.
        </p>

        <p className="font-medium text-brand-900 pt-2">e) Datos técnicos de acceso y seguridad</p>
        <ListaLegal>
          <li>
            Bitácora de accesos: correo utilizado, fecha y hora, dirección IP de origen y resultado
            del intento (exitoso, fallido o bloqueado).
          </li>
          <li>
            Sesiones activas: dirección IP y descripción del dispositivo o navegador desde el que se
            ingresa.
          </li>
          <li>
            Contraseña, almacenada siempre cifrada de forma irreversible, y códigos temporales de
            activación o recuperación.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: seguridad de las cuentas, prevención de accesos no autorizados y trazabilidad.
        </p>

        <p className="font-medium text-brand-900 pt-2">f) Consultas al asistente virtual</p>
        <ListaLegal>
          <li>
            El texto de las preguntas que el usuario escribe al asistente del portal y el resumen de
            su situación en la plataforma que se envía junto a ellas para poder responderlas.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Finalidad: dar soporte al usuario dentro del portal. Ver el apartado 10 sobre la
          transferencia internacional que implica esta función.
        </p>

        <DestacadoLegal>
          <p>
            <strong>No tratamos datos sensibles en este portal.</strong> No se solicitan ni se
            requieren datos de salud, biométricos, genéticos, de pasado judicial, filiación política,
            religión, orientación sexual ni ningún otro dato sensible. Le pedimos que no los incluya
            en los documentos ni en los mensajes que cargue.
          </p>
        </DestacadoLegal>
      </SeccionLegal>

      <SeccionLegal numero={7} titulo="Base de licitud del tratamiento">
        <p>
          El tratamiento descrito no se sustenta principalmente en su consentimiento, sino en las
          siguientes bases previstas en la LOPDP:
        </p>
        <ListaLegal>
          <li>
            <strong>Ejecución de una relación contractual:</strong> la mayor parte de los datos son
            necesarios para evaluar, habilitar y mantener a la empresa como proveedora, y para
            gestionar pedidos, entregas y pagos. Sin ellos la relación comercial no puede
            desarrollarse.
          </li>
          <li>
            <strong>Cumplimiento de una obligación legal:</strong> la verificación de permisos
            sanitarios y habilitantes, y la conservación de documentación tributaria y contractual,
            responden a obligaciones normativas aplicables al sector alimentario y a la normativa
            tributaria ecuatoriana.
          </li>
          <li>
            <strong>Interés legítimo:</strong> la seguridad de la plataforma y la trazabilidad de los
            accesos.
          </li>
          <li>
            <strong>Consentimiento:</strong> únicamente para las finalidades que se le solicitan de
            forma expresa y separada, como el uso del asistente virtual o el envío de comunicaciones
            no relacionadas con la ejecución del contrato. Ese consentimiento es revocable en
            cualquier momento, sin que la revocación afecte la licitud del tratamiento previo.
          </li>
        </ListaLegal>
      </SeccionLegal>

      <SeccionLegal numero={8} titulo="Decisiones automatizadas">
        <p>
          El portal toma algunas decisiones de forma automática, sin intervención humana en el
          momento en que se producen. Se lo informamos expresamente porque estas decisiones producen
          efectos sobre la relación comercial:
        </p>
        <ListaLegal>
          <li>
            <strong>Suspensión por documentación vencida.</strong> Si un documento con fecha de
            caducidad vence y no se reemplaza dentro del plazo de gracia de 15 días, el acceso del
            proveedor al portal queda suspendido en la empresa correspondiente hasta que regularice
            la documentación. Antes de que ocurra se envían avisos por correo: uno 30 días antes del
            vencimiento y luego recordatorios semanales.
          </li>
          <li>
            <strong>Aprobación o rechazo como proveedor.</strong> El proveedor pasa automáticamente a
            estado «Aprobado» cuando se cumplen tres condiciones verificadas por una persona (ficha
            aprobada, documentación aprobada y al menos un producto aprobado), y a «Rechazado» cuando
            al cerrarse la revisión quedan observaciones sin resolver. La calificación de cada ficha,
            documento y producto la realiza siempre una persona; lo automático es únicamente el
            cambio de estado que se deriva de ella.
          </li>
          <li>
            <strong>Calificación global de desempeño.</strong> El portal calcula una nota sobre 100
            puntos a partir del cumplimiento de entregas, las auditorías, la vigencia de la
            documentación y los reclamos registrados. Esta nota es visible para el proveedor con su
            desglose completo, de modo que pueda conocer cómo se compone y qué la afecta.
          </li>
        </ListaLegal>
        <DestacadoLegal>
          <p>
            <strong>Su derecho frente a estas decisiones.</strong> Puede solicitar la intervención
            humana en cualquiera de ellas, obtener una explicación de cómo se llegó al resultado, y
            oponerse o impugnarlo. Escriba a{' '}
            <a className="text-brand-700 underline font-medium" href={`mailto:${emailProteccionDatos}`}>
              {emailProteccionDatos}
            </a>{' '}
            indicando la decisión concreta que quiere que se revise.
          </p>
        </DestacadoLegal>
      </SeccionLegal>

      <SeccionLegal numero={9} titulo="Plazo de conservación">
        <ListaLegal>
          <li>
            <strong>Datos del proveedor y su documentación:</strong> durante toda la relación
            comercial y hasta 15 años después de su terminación, plazo que responde a obligaciones
            tributarias y contractuales.
          </li>
          <li>
            <strong>Prospectos que no llegan a ser proveedores:</strong> un año desde el último
            contacto, salvo que se concrete la relación comercial.
          </li>
          <li>
            <strong>Documentos reemplazados:</strong> cuando un documento fue revisado y rechazado, la
            versión anterior se conserva como respaldo de la revisión. Los archivos que nunca fueron
            revisados se eliminan al ser reemplazados.
          </li>
          <li>
            <strong>Bitácora de accesos y sesiones:</strong> por el tiempo necesario para fines de
            seguridad y auditoría de la plataforma.
          </li>
          <li>
            {/* Los dos plazos son distintos a propósito: el de activación se
                le manda a alguien que no espera el correo (puede tardar días
                en verlo) y el de recuperación se lo pidió la persona hace un
                momento. Ver config/portal.php del backend; si cambian ahí,
                hay que cambiarlos acá: esto es una declaración legal. */}
            <strong>Código de activación de cuenta:</strong> 3 días de vigencia.{' '}
            <strong>Código de recuperación de contraseña:</strong> 20 minutos de vigencia. Ambos
            quedan invalidados al usarse o al expirar.
          </li>
        </ListaLegal>
        <p>
          Vencidos los plazos, los datos se suprimen o se anonimizan, salvo que subsista una
          obligación legal de conservarlos.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={10} titulo="Encargados y transferencias internacionales">
        <p>
          El responsable del tratamiento mantiene procedimientos de contratación que exigen a sus
          proveedores tecnológicos garantías de protección equivalentes a las de la normativa
          ecuatoriana, formalizadas en el contrato correspondiente o en una adenda de tratamiento de
          datos.
        </p>
        <DestacadoLegal>
          <p>
            <strong>Transferencia internacional por el asistente virtual.</strong> El asistente del
            portal funciona sobre un servicio de inteligencia artificial operado por{' '}
            <strong>Anthropic PBC</strong>, con infraestructura en los Estados Unidos de América.
            Cuando usted escribe al asistente, se transfieren a ese proveedor el texto de su consulta
            y un resumen de su situación en el portal (por ejemplo, qué documentos tiene pendientes o
            cuál es su calificación), necesario para poder responderle.
          </p>
          <p className="mt-2">
            Esa información se usa únicamente para generar la respuesta. Si prefiere no utilizar esta
            función, simplemente no escriba al asistente: todas las secciones del portal funcionan de
            forma independiente y ninguna gestión requiere usarlo.
          </p>
        </DestacadoLegal>
        <p>
          Cuando una transferencia internacional sea necesaria, se verificará que el destinatario
          cuente con niveles de protección adecuados, iguales o superiores a los exigidos por la
          normativa ecuatoriana vigente.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={11} titulo="Sus derechos como titular">
        <p>En cualquier momento y de forma gratuita, usted puede:</p>
        <ListaLegal>
          <li>
            <strong>Información y acceso:</strong> saber qué datos suyos tratamos, con qué finalidad y
            durante cuánto tiempo, y obtener copia de ellos.
          </li>
          <li>
            <strong>Rectificación y actualización:</strong> corregir datos inexactos o incompletos.
          </li>
          <li>
            <strong>Eliminación:</strong> solicitar la supresión de sus datos cuando concurra alguna
            de las causales de la LOPDP.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse a un tratamiento concreto.
          </li>
          <li>
            <strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso
            común.
          </li>
          <li>
            <strong>Suspensión del tratamiento</strong> y <strong>revocatoria del consentimiento</strong>{' '}
            cuando este haya sido la base del tratamiento.
          </li>
          <li>
            <strong>No quedar sujeto a decisiones únicamente automatizadas</strong> y pedir
            intervención humana (ver apartado 8).
          </li>
          <li>
            <strong>Reclamar</strong> ante la Autoridad de Protección de Datos Personales del
            Ecuador.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          La eliminación y la revocatoria no proceden mientras subsista una relación comercial,
          contractual o legal activa que obligue a conservar la información, o una obligación legal de
          conservación.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={12} titulo="Cómo ejercer sus derechos">
        <p>
          La vía más simple es el{' '}
          <Link to={RUTAS_LEGALES.formularioDerechos} className="text-brand-700 underline font-medium">
            formulario de atención de derechos
          </Link>
          . También puede escribir directamente a{' '}
          <a className="text-brand-700 underline" href={`mailto:${emailProteccionDatos}`}>
            {emailProteccionDatos}
          </a>
          , indicando:
        </p>
        <ListaLegal>
          <li>Nombre completo, número de cédula y un correo electrónico para la respuesta.</li>
          <li>El derecho que desea ejercer y el motivo.</li>
          <li>Descripción clara de los datos sobre los que quiere ejercerlo.</li>
          <li>Copia de un documento oficial que acredite su identidad.</li>
          <li>
            Si se trata de una rectificación, la corrección concreta solicitada y el respaldo
            correspondiente.
          </li>
        </ListaLegal>
        <p>
          Responderemos en un plazo máximo de <strong>15 días</strong> contados desde el día siguiente
          a la recepción de la solicitud. Si corresponde ejecutarla, se hará efectiva dentro de los 15
          días siguientes a la comunicación de la respuesta.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={13} titulo="Seguridad de la información">
        <p>
          Se aplican medidas administrativas, técnicas y organizativas para proteger los datos
          personales: control de acceso por rol, separación estricta de la información entre
          proveedores y entre empresas del grupo, cifrado irreversible de contraseñas, registro de
          accesos y restricción de los documentos cargados a un repositorio no accesible
          públicamente.
        </p>
        <p>
          Cualquier prueba sobre sistemas que involucre bases de datos con datos personales reales
          debe ser aprobada previamente por el Delegado de Protección de Datos Personales.
        </p>
        <p>
          <strong>Notificación de vulneraciones.</strong> Si se produjera una vulneración de la
          seguridad que afecte sus datos personales y suponga un riesgo para sus derechos, se
          notificará a la Autoridad de Protección de Datos Personales y a los titulares afectados en
          los plazos y condiciones que establece la LOPDP.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={14} titulo="Almacenamiento en su navegador">
        <p>
          Este portal <strong>no utiliza cookies de rastreo, publicidad ni analítica de terceros</strong>.
          No hay herramientas de medición externas ni perfilado de comportamiento.
        </p>
        <p>
          Para funcionar, el portal guarda en el almacenamiento local de su navegador únicamente lo
          siguiente:
        </p>
        <ListaLegal>
          <li>
            El <strong>token de su sesión</strong>, que es lo que lo mantiene identificado mientras
            navega. Se elimina al cerrar sesión.
          </li>
          <li>
            La <strong>empresa activa de la pestaña</strong>, para que pueda trabajar con dos empresas
            del grupo en pestañas distintas.
          </li>
          <li>
            Una marca de que ya vio la <strong>guía de bienvenida</strong>, para no volver a
            mostrársela.
          </li>
        </ListaLegal>
        <p className="text-[14px] text-brand-900/60">
          Puede borrar estos datos en cualquier momento desde la configuración de su navegador; el
          efecto será que se cerrará su sesión.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={15} titulo="Legislación aplicable">
        <p>
          Esta Política se rige por la Constitución de la República del Ecuador, la Ley Orgánica de
          Protección de Datos Personales, su reglamento y demás normativa vigente en la materia, así
          como por las disposiciones que emita a futuro la Autoridad de Protección de Datos
          Personales.
        </p>
      </SeccionLegal>

      <SeccionLegal numero={16} titulo="Vigencia">
        <p>
          {DATOS_EMPRESA.politicaVersion} de la Política de Protección de Datos Personales del Portal
          de Proveedores. Cualquier actualización se publicará en esta misma dirección.
        </p>
        <p className="text-[14px] text-brand-900/60">
          Ante cualquier duda sobre esta Política, escriba a{' '}
          <a className="text-brand-700 underline" href={`mailto:${emailProteccionDatos}`}>
            {emailProteccionDatos}
          </a>
          .
        </p>
      </SeccionLegal>
    </PaginaLegal>
  );
}
