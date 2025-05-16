import { Container, Hero, Section } from "@components/index";
import { useData } from "@hooks/useData";
import { useTranslation } from "@hooks/useTranslation";
import { FunctionComponent } from "react";

/**
 * API Docs Dashboard
 * @overview Status: In-development
 */

const APIDocsDashboard: FunctionComponent = () => {
  const { t } = useTranslation(["common"]);
  const { data, setData } = useData({});

  return (
    <>
      <Hero
        background="red"
        category={[t("category"), "text-danger"]}
        header={[t("header")]}
        description={[t("description")]}
      />
      <Container>
        <Section></Section>
      </Container>
    </>
  );
};

export default APIDocsDashboard;
