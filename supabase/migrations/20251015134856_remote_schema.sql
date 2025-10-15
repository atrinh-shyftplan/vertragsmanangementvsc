

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'ae'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT role::text FROM public.profiles WHERE user_id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "type" "text",
    "is_optional" boolean,
    "sort_order" integer,
    "created_at" timestamp with time zone,
    "module_id" "uuid",
    "contract_type_id" "uuid"
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_attachments" (
    "contract_id" "uuid" NOT NULL,
    "attachment_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name_de" "text" NOT NULL,
    "name_en" "text",
    "description" "text",
    "color" "text" DEFAULT '#6b7280'::"text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."contract_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_compositions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contract_type_key" "text" NOT NULL,
    "module_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contract_compositions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title_de" "text" NOT NULL,
    "title_en" "text",
    "content_de" "text" NOT NULL,
    "content_en" "text",
    "category" "text" DEFAULT 'general'::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "name" "text"
);


ALTER TABLE "public"."contract_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contract_type_key" "text" NOT NULL,
    "template_data" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."contract_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name_de" "text" NOT NULL,
    "name_en" "text",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."contract_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "client" "text",
    "contract_type_id" "uuid",
    "assigned_to_profile_id" "uuid",
    "variables" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."global_variables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name_de" "text" NOT NULL,
    "name_en" "text",
    "description" "text",
    "default_value" "text",
    "is_required" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "category" "text" DEFAULT 'general'::"text"
);


ALTER TABLE "public"."global_variables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'ae'::"public"."user_role",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text",
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "configuration" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."template_configurations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_attachments"
    ADD CONSTRAINT "contract_attachments_pkey" PRIMARY KEY ("contract_id", "attachment_id");



ALTER TABLE ONLY "public"."contract_categories"
    ADD CONSTRAINT "contract_categories_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."contract_categories"
    ADD CONSTRAINT "contract_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_compositions"
    ADD CONSTRAINT "contract_compositions_contract_type_key_module_key_key" UNIQUE ("contract_type_key", "module_key");



ALTER TABLE ONLY "public"."contract_compositions"
    ADD CONSTRAINT "contract_compositions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_modules"
    ADD CONSTRAINT "contract_modules_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."contract_modules"
    ADD CONSTRAINT "contract_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_variables"
    ADD CONSTRAINT "global_variables_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."global_variables"
    ADD CONSTRAINT "global_variables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."template_configurations"
    ADD CONSTRAINT "template_configurations_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_contract_categories_updated_at" BEFORE UPDATE ON "public"."contract_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contract_modules_updated_at" BEFORE UPDATE ON "public"."contract_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contract_templates_updated_at" BEFORE UPDATE ON "public"."contract_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contract_types_updated_at" BEFORE UPDATE ON "public"."contract_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_global_variables_updated_at" BEFORE UPDATE ON "public"."global_variables" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_template_configurations_updated_at" BEFORE UPDATE ON "public"."template_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."contract_modules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contract_attachments"
    ADD CONSTRAINT "contract_attachments_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_attachments"
    ADD CONSTRAINT "contract_attachments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_compositions"
    ADD CONSTRAINT "contract_compositions_module_key_fkey" FOREIGN KEY ("module_key") REFERENCES "public"."contract_modules"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_modules"
    ADD CONSTRAINT "contract_modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contract_modules"
    ADD CONSTRAINT "fk_contract_modules_category" FOREIGN KEY ("category") REFERENCES "public"."contract_categories"("key") ON UPDATE CASCADE ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."global_variables"
    ADD CONSTRAINT "global_variables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_configurations"
    ADD CONSTRAINT "template_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Authenticated users can manage contract categories" ON "public"."contract_categories" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage contract compositions" ON "public"."contract_compositions" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage contract modules" ON "public"."contract_modules" TO "authenticated", "anon" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage contract templates" ON "public"."contract_templates" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage contract types" ON "public"."contract_types" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage global variables" ON "public"."global_variables" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage template configurations" ON "public"."template_configurations" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view contract categories" ON "public"."contract_categories" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view contract compositions" ON "public"."contract_compositions" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view contract modules" ON "public"."contract_modules" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view contract templates" ON "public"."contract_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view contract types" ON "public"."contract_types" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view global variables" ON "public"."global_variables" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view template configurations" ON "public"."template_configurations" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Policy with security definer functions" ON "public"."attachments" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Policy with security definer functions" ON "public"."contract_attachments" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Policy with security definer functions" ON "public"."contracts" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_compositions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_variables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_configurations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."contract_attachments" TO "anon";
GRANT ALL ON TABLE "public"."contract_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."contract_categories" TO "anon";
GRANT ALL ON TABLE "public"."contract_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_categories" TO "service_role";



GRANT ALL ON TABLE "public"."contract_compositions" TO "anon";
GRANT ALL ON TABLE "public"."contract_compositions" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_compositions" TO "service_role";



GRANT ALL ON TABLE "public"."contract_modules" TO "anon";
GRANT ALL ON TABLE "public"."contract_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_modules" TO "service_role";



GRANT ALL ON TABLE "public"."contract_templates" TO "anon";
GRANT ALL ON TABLE "public"."contract_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_templates" TO "service_role";



GRANT ALL ON TABLE "public"."contract_types" TO "anon";
GRANT ALL ON TABLE "public"."contract_types" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_types" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."global_variables" TO "anon";
GRANT ALL ON TABLE "public"."global_variables" TO "authenticated";
GRANT ALL ON TABLE "public"."global_variables" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."template_configurations" TO "anon";
GRANT ALL ON TABLE "public"."template_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."template_configurations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "insert  1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND ((storage.foldername(name))[2] = 'contract-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "select 1ffg0oo_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND ((storage.foldername(name))[2] = 'contract-images'::text) AND (auth.role() = 'authenticated'::text)));



