import InvoiceLayout from "@/components/layouts/InvoiceLayout";


type Params = { id: string };

const UpdateInvoice = async ({ params }: { params: Promise<Params> }) => {
    const { id } = await params;
    

    return (
        <InvoiceLayout id={id} />
    );
};

export default UpdateInvoice;
