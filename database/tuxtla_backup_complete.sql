--
-- PostgreSQL database dump
--

\restrict ezVrRpurWsCy0DygHoN0DQP1lkWHFfsoikCBWqJOnMezRcZcrrHpPseaSjHNbOo

-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_citizen_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.report_upvotes DROP CONSTRAINT IF EXISTS report_upvotes_report_id_fkey;
DROP INDEX IF EXISTS public.idx_reports_status;
DROP INDEX IF EXISTS public.idx_reports_location;
DROP INDEX IF EXISTS public.idx_reports_category;
DROP INDEX IF EXISTS public.idx_report_upvotes_user;
DROP INDEX IF EXISTS public.idx_report_upvotes_fp;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.report_upvotes DROP CONSTRAINT IF EXISTS report_upvotes_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.report_upvotes;
DROP FUNCTION IF EXISTS public.check_duplicate_report(p_category public.category_enum, p_lat double precision, p_lng double precision, p_radius_meters double precision);
DROP TYPE IF EXISTS public.status_enum;
DROP TYPE IF EXISTS public.role_enum;
DROP TYPE IF EXISTS public.category_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS postgis;
--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.category_enum AS ENUM (
    'BACHE',
    'LUMINARIA',
    'BASURA',
    'ARBOL_CAIDO',
    'FUGA_AGUA',
    'DRENAJE',
    'SEMAFORO'
);


ALTER TYPE public.category_enum OWNER TO postgres;

--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_enum AS ENUM (
    'CIUDADANO',
    'BRIGADISTA',
    'ADMIN'
);


ALTER TYPE public.role_enum OWNER TO postgres;

--
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'RECIBIDO',
    'EN_REVISION',
    'EN_ATENCION',
    'RESUELTO'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- Name: check_duplicate_report(public.category_enum, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_duplicate_report(p_category public.category_enum, p_lat double precision, p_lng double precision, p_radius_meters double precision DEFAULT 30.0) RETURNS TABLE(id uuid, title character varying, distance_meters double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        ST_Distance(
            r.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM reports r
    WHERE r.category = p_category
      AND r.status != 'RESUELTO'
      AND ST_DWithin(
            r.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.check_duplicate_report(p_category public.category_enum, p_lat double precision, p_lng double precision, p_radius_meters double precision) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: report_upvotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_upvotes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    report_id uuid NOT NULL,
    user_id uuid,
    fingerprint character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_upvotes OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    category public.category_enum NOT NULL,
    status public.status_enum DEFAULT 'RECIBIDO'::public.status_enum,
    location public.geometry(Point,4326) NOT NULL,
    address character varying(255),
    photo_url text,
    citizen_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_to uuid,
    brigade_notes text,
    upvotes_count integer DEFAULT 0
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.role_enum DEFAULT 'CIUDADANO'::public.role_enum,
    phone character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: report_upvotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_upvotes (id, report_id, user_id, fingerprint, created_at) FROM stdin;
ee85a27d-7c0a-4890-81ac-d8feef747f75	2c15c9d8-8da5-4dde-a621-3b171bc9301e	c3333333-3333-3333-3333-333333333333	\N	2026-10-15 12:48:56.636281-06
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, title, description, category, status, location, address, photo_url, citizen_id, created_at, updated_at, assigned_to, brigade_notes, upvotes_count) FROM stdin;
22222222-2222-2222-2222-222222222222	Bache profundo frente al parque central	Bache de gran tamaño en carril derecho ocasiona daño a suspensiones.	BACHE	RECIBIDO	0101000020E610000008AC1C5A644757C054E3A59BC4C03040	Av. Central esquina Calle Central, Centro	\N	\N	2026-10-14 23:20:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	0
33333333-3333-3333-3333-333333333333	Luminaria apagada en avenida Central	Lámpara de alumbrado público fundida dejando tramo oscuro e inseguro por las noches.	LUMINARIA	EN_ATENCION	0101000020E610000000000000004857C08D976E1283C03040	Av. Central Poniente entre 8a y 9a Poniente	\N	c3333333-3333-3333-3333-333333333333	2026-10-12 00:20:30.332759-06	2026-10-15 00:20:30.332759-06	b4444444-4444-4444-4444-444444444444	\N	6
11111111-1111-1111-1111-111111111111	Basura en la 5a norte	Acumulación de bolsas de basura en esquina comercial obstruyendo el paso peatonal.	BASURA	EN_REVISION	0101000020E6100000560E2DB29D4757C01904560E2DC23040	5a Norte Poniente, Barrio Colón	\N	c3333333-3333-3333-3333-333333333333	2026-10-14 23:20:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	3
77777777-7777-7777-7777-777777777777	Rama rota en San Roque	Árbol con riesgo inminente de caer sobre cableado de telefonía.	ARBOL_CAIDO	RECIBIDO	0101000020E6100000BA490C022B4757C0736891ED7CBF3040	4a Sur Oriente, Barrio San Roque	\N	\N	2026-10-13 00:20:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	0
99999999-9999-9999-9999-999999999999	Falla en semáforo crucero Las Palmas	Semáforo en destello constante provocando congestionamiento vial.	SEMAFORO	RECIBIDO	0101000020E6100000AE47E17A144657C0C74B378941C03040	Boulevard Ángel Albino Corzo y Las Palmas	\N	\N	2026-10-14 23:50:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	0
739032e4-4b9f-4223-852d-86717b55d00f	Bache en Libramiento Norte Poniente	Bache profundo cerca de la torre Chiapas.	BACHE	RECIBIDO	0101000020E61000003D0AD7A3704557C0508D976E12C33040	Libramiento Norte Oriente	\N	\N	2026-10-14 22:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	0
661b2e04-18be-4af0-a980-60f7becf493f	Semáforo intermitente en Crucero Reloj Floral	Falla en cambio de luz verde a roja.	SEMAFORO	RECIBIDO	0101000020E610000046B6F3FDD44857C01904560E2DC23040	Boulevard Belisario Domínguez	\N	\N	2026-10-14 21:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	0
47d48421-bcfd-4358-ac7b-edef0edeb319	Bache profundo	Bache profundo	BACHE	RECIBIDO	0101000020E61000009EF37200AE4557C0B701CBDF4FC03040	Calz. Ángel Albino Corzo, Fracc. Las Palmas	\N	c3333333-3333-3333-3333-333333333333	2026-10-15 01:09:46.546246-06	2026-10-15 01:09:46.546246-06	\N	\N	0
2f33cb2d-d3a0-484e-af61-a7e902126b8c	poste caido	poste caido	LUMINARIA	RECIBIDO	0101000020E6100000F52F7194E64657C04F36C6F18CB33040	Carretera a Copoya, El Jobo / Copoya	\N	c3333333-3333-3333-3333-333333333333	2026-10-15 01:20:56.493258-06	2026-10-15 01:20:56.493258-06	\N	\N	6
2c15c9d8-8da5-4dde-a621-3b171bc9301e	Bache en acceso a San José Terán	Cráter de 2 metros en curva peligrosa.	BACHE	EN_ATENCION	0101000020E6100000EE7C3F355E4A57C0B0726891EDBC3040	Camino a San José Terán	\N	\N	2026-10-14 18:55:15.328352-06	2026-10-15 00:55:15.328352-06	b2222222-2222-2222-2222-222222222222	\N	15
55555555-5555-5555-5555-555555555555	Luminaria parpadeando en Calzada Hombres Ilustres	Falla intermitente en poste eléctrico frente al jardín botánico.	LUMINARIA	EN_REVISION	0101000020E6100000E5D022DBF94657C06F1283C0CAC13040	Calzada de las Personas Ilustres	\N	\N	2026-10-14 18:20:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	6
a00b38ab-aa6d-4a1d-b917-8827f25d00fe	Árbol con ramas caídas en Plan de Ayala	Ramas de eucalipto obstruyen un carril.	ARBOL_CAIDO	EN_ATENCION	0101000020E6100000986E1283C04A57C06F1283C0CAC13040	Av. Nuevo León, Plan de Ayala	\N	\N	2026-10-13 00:55:15.328352-06	2026-10-15 00:55:15.328352-06	b5555555-5555-5555-5555-555555555555	\N	0
3d86b012-1820-44e5-abf1-7336148eade6	Semáforo caído por accidente en Diana Cazadora	Semáforo derribado sobre banqueta.	SEMAFORO	RESUELTO	0101000020E61000001283C0CAA14557C039B4C876BEBF3040	Boulevard Ángel Albino Corzo	\N	\N	2026-10-14 23:55:15.328352-06	2026-10-15 12:07:05.768969-06	b4444444-4444-4444-4444-444444444444	\N	0
66666666-6666-6666-6666-666666666666	Bache peligroso en Blvd. Belisario Domínguez	Desprendimiento de carpeta asfáltica en incorporación rápida.	BACHE	EN_ATENCION	0101000020E61000001B2FDD24064957C0FCA9F1D24DC23040	Boulevard Belisario Domínguez km 1081	\N	\N	2026-10-14 00:20:30.332759-06	2026-10-15 00:20:30.332759-06	b2222222-2222-2222-2222-222222222222	\N	14
02a1fa91-b758-42d0-b838-afb4c2b29910	Bache frente a Plaza Cristal	Hundimiento en carril de transporte colectivo.	BACHE	EN_ATENCION	0101000020E6100000D34D6210584957C08B6CE7FBA9C13040	Carretera Panamericana 190	\N	\N	2026-10-14 09:55:15.328352-06	2026-10-15 00:55:15.328352-06	b2222222-2222-2222-2222-222222222222	\N	14
91fad955-edf6-48b0-b36a-508d00295e14	Fuga de agua potable en Caña Hueca	Tubería rota en acceso al parque recreativo.	FUGA_AGUA	RECIBIDO	0101000020E6100000B6F3FDD4784957C0355EBA490CC23040	Prolongación 5a Norte Poniente	\N	\N	2026-10-14 00:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	8
88888888-8888-8888-8888-888888888888	Fuga de agua potable en Terán	Fuga de agua constante saliendo de la banqueta hacia el asfalto.	FUGA_AGUA	EN_ATENCION	0101000020E610000052B81E85EB4957C01F85EB51B8BE3040	2a Poniente Sur, Delegación Terán	\N	\N	2026-10-14 20:20:30.332759-06	2026-10-15 00:20:30.332759-06	b3333333-3333-3333-3333-333333333333	\N	8
0f4c2284-6303-4f6e-8735-37b8b9a7baf7	Fuga en medidor de agua en Moctezuma	Fuga constante sobre banqueta peatonal.	FUGA_AGUA	EN_ATENCION	0101000020E6100000D578E926314857C0894160E5D0C23040	Calle 13a Poniente Norte, Moctezuma	\N	\N	2026-10-14 17:55:15.328352-06	2026-10-15 10:17:38.941958-06	b3333333-3333-3333-3333-333333333333	\N	8
90aaffbc-12f3-4911-9b79-997a044398ab	Lámpara apagada en Parque Bicentenario	Luminaria fundida sobre andador principal.	LUMINARIA	EN_REVISION	0101000020E6100000C74B3789414857C037894160E5C03040	12a Poniente Sur, Bicentenario	\N	\N	2026-10-14 20:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	6
9d221b9e-13fc-4bd1-ba7a-a50b02427e3b	Luminaria sin foco en Patria Nueva	Poste número 42 sin iluminación nocturna.	LUMINARIA	RECIBIDO	0101000020E6100000F853E3A59B4457C0DD24068195C33040	Av. Cedros, Patria Nueva	\N	\N	2026-10-10 00:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	6
7e73ac6b-8efd-47d3-8048-cbdf52d6842c	Luminaria titilando en Santa Elena	Luz blanca parpadea generando inseguridad.	LUMINARIA	EN_REVISION	0101000020E6100000A8C64B37894957C0F853E3A59BC43040	Calle Santa Elena Poniente	\N	\N	2026-10-13 00:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	6
4b0552ed-ddc2-4d86-93c3-7daab3b0218b	Drenaje colapsado en Mercado de los Ancianos	Aguas negras brotando del registro pluvial.	DRENAJE	EN_REVISION	0101000020E6100000C976BE9F1A4757C0B0726891EDBC3040	Calle 13a Sur Oriente	\N	\N	2026-10-14 12:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	11
44444444-4444-4444-4444-444444444444	Contenedor desbordado en Parque de la Marimba	Contenedores llenos de residuos de visitantes del parque.	BASURA	RECIBIDO	0101000020E610000096438B6CE74757C0FED478E926C13040	8a Poniente Norte, Guadalupe	\N	\N	2026-10-14 19:20:30.332759-06	2026-10-15 00:20:30.332759-06	\N	\N	3
77b4c1eb-9721-4470-8cc5-76bea7649e70	Basura en camellón de Libramiento Sur	Residuos sólidos arrojados de vehículos.	BASURA	RECIBIDO	0101000020E6100000713D0AD7A34857C05C8FC2F528BC3040	Libramiento Sur Poniente	\N	\N	2026-10-14 00:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	3
f1200798-6141-43a9-84a5-f1533769396d	Contenedores sucios en Parque de la Juventud	Basura acumulada por eventos juveniles.	BASURA	RECIBIDO	0101000020E610000062105839B44857C0E17A14AE47C13040	Calle 16a Poniente Sur	\N	\N	2026-10-14 14:55:15.328352-06	2026-10-15 00:55:15.328352-06	\N	\N	3
5ec93b1e-5512-41b7-9614-adbab21fd397	Acumulación de basura en Calzada al Sumidero	Bolsas rotas frente al OXXO de Las Granjas.	BASURA	EN_ATENCION	0101000020E61000004A0C022B874657C06666666666C63040	Calzada al Sumidero, Las Granjas	\N	\N	2026-10-14 16:55:15.328352-06	2026-10-15 00:55:15.328352-06	b6666666-6666-6666-6666-666666666666	\N	3
67e4b5c8-8565-4c35-aa0d-2f75c7115b0d	arbol	arbol	ARBOL_CAIDO	RECIBIDO	0101000020E610000048AF4AB93A5157C0C355FB206CCC3040	Avenida Central Oriente, Berriozábal, Chiapas	\N	c3333333-3333-3333-3333-333333333333	2026-10-15 12:15:26.777275-06	2026-10-15 12:15:26.777275-06	\N	\N	0
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, phone, created_at) FROM stdin;
a1111111-1111-1111-1111-111111111111	Ing. Carlos Mendoza	admin@tuxtla.gob.mx	$2b$10$vQp0YralqG.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	ADMIN	9611234567	2026-10-15 00:36:12.65458-06
b2222222-2222-2222-2222-222222222222	Brigada Obras Públicas 04	brigada@tuxtla.gob.mx	$2b$10$vQp0YralqG.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	BRIGADISTA	9617654321	2026-10-15 00:36:12.665459-06
c3333333-3333-3333-3333-333333333333	María Elena Solís	ciudadana@tuxtla.gob.mx	$2b$10$vQp0YralqG.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	CIUDADANO	9619876543	2026-10-15 00:36:12.667481-06
6232f194-2a0e-4717-a8c7-a2d7ceb9cd4e	Juan Pérez	juan.perez@gmail.com	$2b$10$vPXXHChP2gUHnumFXiJwLOPErI.0SMXnpW7vKr27ALMCvQKdo/ZgS	CIUDADANO	9611112233	2026-10-15 08:39:00.01988-06
b3333333-3333-3333-3333-333333333333	Cuadrilla SMAPA Poniente (Agua y Drenaje)	smapa.cuadrilla@tuxtla.gob.mx	\\\\\\.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	BRIGADISTA	9612345678	2026-10-15 11:26:47.941969-06
b4444444-4444-4444-4444-444444444444	Brigada Alumbrado y Vialidad 02	alumbrado.brigada@tuxtla.gob.mx	\\\\\\.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	BRIGADISTA	9613456789	2026-10-15 11:26:47.941969-06
b5555555-5555-5555-5555-555555555555	Cuadrilla Protección Civil Tuxtla	pc.cuadrilla@tuxtla.gob.mx	\\\\\\.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	BRIGADISTA	9614567890	2026-10-15 11:26:47.941969-06
b6666666-6666-6666-6666-666666666666	Brigada Limpia y Aseo Urbano 01	limpia.brigada@tuxtla.gob.mx	\\\\\\.0hY84.zLKxexwlRYsAwC5sgNxXdLN07CRgAs8q4iT6	BRIGADISTA	9615678901	2026-10-15 11:26:47.941969-06
\.


--
-- Name: report_upvotes report_upvotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_upvotes
    ADD CONSTRAINT report_upvotes_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_report_upvotes_fp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_report_upvotes_fp ON public.report_upvotes USING btree (report_id, fingerprint) WHERE ((fingerprint IS NOT NULL) AND (user_id IS NULL));


--
-- Name: idx_report_upvotes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_report_upvotes_user ON public.report_upvotes USING btree (report_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_reports_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_category ON public.reports USING btree (category);


--
-- Name: idx_reports_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_location ON public.reports USING gist (location);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: report_upvotes report_upvotes_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_upvotes
    ADD CONSTRAINT report_upvotes_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_citizen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ezVrRpurWsCy0DygHoN0DQP1lkWHFfsoikCBWqJOnMezRcZcrrHpPseaSjHNbOo

