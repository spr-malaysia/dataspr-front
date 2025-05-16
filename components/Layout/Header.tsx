import Container from "@components/Container";
import Nav from "@components/Nav";
import { useTranslation } from "@hooks/useTranslation";
import Image from "next/image";
import Link from "next/link";
import { FunctionComponent, ReactNode } from "react";

interface HeaderProps {
  stateSelector?: ReactNode;
}

const Header: FunctionComponent<HeaderProps> = ({ stateSelector }) => {
  const { t } = useTranslation("common");

  return (
    <div className="dark:border-zinc-800 fixed left-0 top-0 z-30 w-full border-b">
      <Container
        background="bg-white dark:bg-zinc-900"
        className="flex items-center gap-4 py-[11px]"
      >
        <div className="flex w-full items-center gap-4">
          <Link href="/">
            <div className="flex cursor-pointer gap-2">
              <div className="flex w-8 items-center justify-center">
                <Image
                  src="/static/images/jata_logo.png"
                  width={48}
                  height={36}
                  alt="jata_logo"
                />
              </div>
              <h4>data.spr.gov.my</h4>
            </div>
          </Link>

          <Nav stateSelector={stateSelector}>
            {(close) => (
              <>
                <Nav.Item
                  key={"/"}
                  title={t("common:nav.home")}
                  link="/"
                  onClick={close}
                />
                <Nav.Item
                  title={t("dashboard-election-explorer:elections")}
                  link="/elections"
                  key="/elections"
                  onClick={close}
                />
                <Nav.Item
                  title={t("dashboard-election-explorer:candidates")}
                  link="/candidates"
                  key="/candidates"
                  onClick={close}
                />
                <Nav.Item
                  title={t("dashboard-election-explorer:parties")}
                  link="/parties"
                  key="/parties"
                  onClick={close}
                />
                <Nav.Item
                  title="Trivia"
                  link="/trivia"
                  key="/trivia"
                  onClick={close}
                />
                <Nav.Item
                  title={t("common:nav.catalogue")}
                  key="/data-catalogue"
                  link="/data-catalogue"
                  onClick={close}
                />
                <Nav.Item
                  title={t("common:nav.api_docs")}
                  key="api_docs"
                  link="/api-docs"
                  onClick={close}
                />
              </>
            )}
          </Nav>
        </div>
      </Container>
    </div>
  );
};

export default Header;
