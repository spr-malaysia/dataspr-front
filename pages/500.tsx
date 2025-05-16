import Container from "@components/Container";
import ErrorStatus from "@components/ErrorStatus";
import Metadata from "@components/Metadata";
import { withi18n } from "@lib/decorators";
import { Page } from "@lib/types";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";

const Error500: Page = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <Metadata title={t("common:error.500.title")} keywords={""} />
      <Container className="min-h-[76vh] pt-7 text-zinc-900">
        <ErrorStatus
          title={t("common:error.500.title")}
          description={t("common:error.500.description")}
          code={500}
          reason={t("common:error.500.reason")}
        />
      </Container>
    </>
  );
};

export default Error500;

export const getStaticProps: GetStaticProps = withi18n(null, async () => {
  return {
    props: {
      meta: {
        id: "error-500",
        type: "misc",
      },
    },
  };
});
