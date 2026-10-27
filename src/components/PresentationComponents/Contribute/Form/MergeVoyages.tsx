import '@/style/contributeContent.scss';
import { useState } from 'react';

import { Form, Input, Button, Row, Col } from 'antd';

const MergeVoyages: React.FC = () => {
  const [form] = Form.useForm();
  const [voyageId, setVoyageId] = useState<string>('');
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (voyageId) {
      alert(`Sucessfully password change`);
    } else {
      alert(`Password is not match, try again`);
    }
  };

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">Merge Existing Records of Voyages</h1>
      <div className="content-inner-wrapper">
        <p> Please select two or more existing voyage records for merging.</p>
        <Form layout="horizontal" form={form} onFinish={handleSubmit}>
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Form.Item
                label="Voyage ID:"
                style={{ flex: 1, marginBottom: 0 }}
                name="voyageId"
                rules={[{ required: true, message: 'Please input Voyage ID!' }]}
              >
                <Input
                  placeholder="Enter Voyage ID"
                  type="number"
                  value={voyageId}
                  width={320}
                  onChange={(e) => setVoyageId(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                ghost
                style={{
                  marginLeft: 10,
                  height: 32,
                  borderColor: 'rgb(55, 148, 141)',
                  color: 'rgb(55, 148, 141)',
                }}
                onClick={() => form.submit()}
              >
                Search
              </Button>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                backgroundColor: 'rgb(55, 148, 141)',
                height: 32,
              }}
            >
              Begin
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
export default MergeVoyages;
